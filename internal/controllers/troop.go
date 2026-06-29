package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"
)

type TroopController struct {
	DB *sqlx.DB
}

type TrainRequest struct {
	TroopName string `json:"troop_name"`
	Quantity  int    `json:"quantity"`
}

func (tc *TroopController) TrainUnitsInstant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var req TrainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 {
		http.Error(w, "You must train at least 1 unit", http.StatusBadRequest)
		return
	}

	tx, err := tc.DB.Beginx()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var troop struct {
		ID        string `db:"id"`
		LevelInfo string `db:"level_info"`
	}
	if err := tx.Get(&troop, "SELECT id, level_info FROM troop_info WHERE name = $1 LIMIT 1", req.TroopName); err != nil {
		http.Error(w, "We don't offer that troop type in our camp barracks", http.StatusNotFound)
		return
	}

	var stats map[string]map[string]any
	if err := json.Unmarshal([]byte(troop.LevelInfo), &stats); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	costVal, exists := stats["1"]["cost_elixir"]
	if !exists {
		http.Error(w, "Elixir cost rules missing from seed tables", http.StatusInternalServerError)
		return
	}
	unitCost := int64(costVal.(float64))
	totalCost := unitCost * int64(req.Quantity)

	result, err := tx.Exec(`
	UPDATE resources
	SET elixir = elixir - $1,
		updated_at = NOW()
	WHERE player_id = $2
	AND elixir >= $1
	`,
		totalCost,
		userID,
	)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	rows, err := result.RowsAffected()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if rows == 0 {
		http.Error(w, "You don't have enough Elixir for this training order", http.StatusPaymentRequired)
		return
	}

	saveQuery := `
        INSERT INTO player_troop (id, player_id, troop_info_id, quantity, level)
        VALUES (gen_random_uuid(), $1, $2, $3, 1)
        ON CONFLICT (player_id, troop_info_id, level) 
        DO UPDATE SET quantity = player_troop.quantity + EXCLUDED.quantity`

	if _, err := tx.Exec(saveQuery, userID, troop.ID, req.Quantity); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":       "Success",
		"message":      "Units trained and stationed in your base camp",
		"troop_name":   req.TroopName,
		"quantity":     req.Quantity,
		"elixir_spent": totalCost,
	})
}

func (tc *TroopController) ListMyTroops(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var rows []struct {
		Name     string `db:"name"`
		Quantity int    `db:"quantity"`
		Level    int    `db:"level"`
	}
	if err := tc.DB.Select(&rows, `
		SELECT ti.name, pt.quantity, pt.level
		FROM player_troop pt
		JOIN troop_info ti ON ti.id = pt.troop_info_id
		WHERE pt.player_id = $1 AND pt.quantity > 0
		ORDER BY ti.name`, userID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	troops := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		troops = append(troops, map[string]any{
			"name":     row.Name,
			"quantity": row.Quantity,
			"level":    row.Level,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"troops": troops,
	})
}
