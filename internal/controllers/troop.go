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

// TrainUnitsInstant verifies elixir costs and builds out the player's available combat force
func (tc *TroopController) TrainUnitsInstant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Make sure we know who is calling this endpoint
	userID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var incoming TrainRequest
	if err := json.NewDecoder(r.Body).Decode(&incoming); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if incoming.Quantity <= 0 {
		http.Error(w, "You must train at least 1 unit", http.StatusBadRequest)
		return
	}

	// Keep everything safe in a database transaction block
	dbTx, err := tc.DB.Beginx()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer dbTx.Rollback()

	// 1. Grab the specifications for the requested troop type
	var catalogSpec struct {
		ID        string `db:"id"`
		LevelInfo string `db:"level_info"`
	}
	specQuery := `SELECT id, level_info FROM troop_info WHERE name = $1 LIMIT 1`
	if err := dbTx.Get(&catalogSpec, specQuery, incoming.TroopName); err != nil {
		http.Error(w, "We don't offer that troop type in our camp barracks", http.StatusNotFound)
		return
	}

	// Pull the level 1 elixir pricing out of the JSON metadata string
	var statistics map[string]map[string]interface{}
	if err := json.Unmarshal([]byte(catalogSpec.LevelInfo), &statistics); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	costKey, exists := statistics["1"]["cost_elixir"]
	if !exists {
		http.Error(w, "Elixir cost rules missing from seed tables", http.StatusInternalServerError)
		return
	}
	unitCost := int64(costKey.(float64))
	billTotal := unitCost * int64(incoming.Quantity)

	// 2. Double-check if the user has enough elixir in the bank
	var bankBalance int64
	if err := dbTx.Get(&bankBalance, "SELECT elixir FROM resources WHERE player_id = $1", userID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if bankBalance < billTotal {
		http.Error(w, "You don't have enough Elixir for this training order", http.StatusPaymentRequired)
		return
	}

	// 3. Charge the user by deducting the total cost
	deductFunds := `UPDATE resources SET elixir = elixir - $1, updated_at = NOW() WHERE player_id = $2`
	if _, err := dbTx.Exec(deductFunds, billTotal, userID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// 4. Update or insert the troop records into the player's database tables
	saveTroops := `
		INSERT INTO player_troop (id, player_id, troop_info_id, quantity, level)
		VALUES (gen_random_uuid(), $1, $2, $3, 1)
		ON CONFLICT (player_id, troop_info_id, level) 
		DO UPDATE SET quantity = player_troop.quantity + EXCLUDED.quantity`

	if _, err := dbTx.Exec(saveTroops, userID, catalogSpec.ID, incoming.Quantity); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if err := dbTx.Commit(); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       "Success",
		"message":      "Units trained and stationed in your base camp",
		"troop_name":   incoming.TroopName,
		"quantity":     incoming.Quantity,
		"elixir_spent": billTotal,
	})
}
