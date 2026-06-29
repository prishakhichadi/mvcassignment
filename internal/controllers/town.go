package controllers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jmoiron/sqlx"
)

type TownController struct {
	DB *sqlx.DB
}

func (tc *TownController) GetLayout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	playerID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var town struct {
		ID    string `db:"id"`
		Level int    `db:"level"`
	}
	if err := tc.DB.Get(&town, `SELECT id, level FROM town WHERE player_id = $1`, playerID); err != nil {
		http.Error(w, "Town not found", http.StatusNotFound)
		return
	}

	var res struct {
		Gold   int64 `db:"gold"`
		Elixir int64 `db:"elixir"`
	}
	if err := tc.DB.Get(&res, `SELECT gold, elixir FROM resources WHERE player_id = $1`, playerID); err != nil {
		http.Error(w, "Resources not found", http.StatusInternalServerError)
		return
	}

	var stats struct {
		WinsAttack  int `db:"wins_attack"`
		WinsDefense int `db:"wins_defense"`
		TrophyCount int `db:"trophy_count"`
	}
	if err := tc.DB.Get(&stats, `SELECT wins_attack, wins_defense, trophy_count FROM player_stats WHERE player_id = $1`, playerID); err != nil {
		http.Error(w, "Stats not found", http.StatusInternalServerError)
		return
	}

	var buildings []struct {
		Name string `db:"name"`
		X    int    `db:"x"`
		Y    int    `db:"y"`
	}
	if err := tc.DB.Select(&buildings, `
		SELECT bi.name, tb.x, tb.y
		FROM town_buildings tb
		JOIN building_info bi ON tb.building_info_id = bi.id
		WHERE tb.town_id = $1`, town.ID); err != nil {
		http.Error(w, "Buildings not found", http.StatusInternalServerError)
		return
	}

	grid := make([][]string, 10)
	for i := range grid {
		grid[i] = make([]string, 10)
	}
	for _, b := range buildings {
		if b.X >= 0 && b.X < 10 && b.Y >= 0 && b.Y < 10 {
			grid[b.Y][b.X] = b.Name
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"player_id":  playerID,
		"town_id":    town.ID,
		"town_level": town.Level,
		"resources": map[string]int64{
			"gold":   res.Gold,
			"elixir": res.Elixir,
		},
		"stats": map[string]int{
			"wins_attack":  stats.WinsAttack,
			"wins_defense": stats.WinsDefense,
			"trophies":     stats.TrophyCount,
		},
		"grid": grid,
	})
}

func (tc *TownController) PlaceStructure(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	playerID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var req struct {
		BuildingName string `json:"building_name"`
		X            int    `json:"x"`
		Y            int    `json:"y"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if req.X < 0 || req.X > 9 || req.Y < 0 || req.Y > 9 {
		http.Error(w, "Coordinates must be between 0 and 9", http.StatusBadRequest)
		return
	}

	tx, err := tc.DB.Beginx()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var townID string
	if err := tx.Get(&townID, `SELECT id FROM town WHERE player_id = $1`, playerID); err != nil {
		http.Error(w, "Town not found", http.StatusNotFound)
		return
	}

	var building struct {
		ID        string `db:"id"`
		LevelInfo string `db:"level_info"`
	}
	if err := tx.Get(&building, `SELECT id, level_info FROM building_info WHERE name = $1 LIMIT 1`, req.BuildingName); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Building type not found", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var levelStats map[string]map[string]any
	if err := json.Unmarshal([]byte(building.LevelInfo), &levelStats); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	goldCost := int64(0)
	if lvl1, ok := levelStats["1"]; ok {
		if v, ok := lvl1["cost_gold"]; ok {
			if f, ok := v.(float64); ok {
				goldCost = int64(f)
			}
		}
	}

	result, err := tx.Exec(`
	UPDATE resources
	SET gold = gold - $1,
		updated_at = NOW()
	WHERE player_id = $2
	AND gold >= $1
	`,
		goldCost,
		playerID,
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
		http.Error(w, "Not enough gold", http.StatusPaymentRequired)
		return
	}

	if _, err := tx.Exec(`
		INSERT INTO town_buildings (id, town_id, building_info_id, level, x, y)
		VALUES (gen_random_uuid(), $1, $2, 1, $3, $4)`,
		townID, building.ID, req.X, req.Y); err != nil {
		http.Error(w, "Could not place building", http.StatusInternalServerError)
		return
	}

	var count int
	tx.Get(&count, `SELECT COUNT(*) FROM town_buildings WHERE town_id = $1`, townID)
	if count >= 1 {
		var existing int
		tx.Get(&existing, `SELECT COUNT(*) FROM achievements_log WHERE player_id = $1 AND type = 'buildings_upgraded'`, playerID)
		if existing == 0 {
			tx.Exec(`INSERT INTO achievements_log (id, player_id, type, created_at) VALUES (gen_random_uuid(), $1, 'buildings_upgraded', NOW())`, playerID)
		}
	}

	if err := tx.Commit(); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":     "success",
		"message":    fmt.Sprintf("%s placed at (%d, %d)", req.BuildingName, req.X, req.Y),
		"gold_spent": goldCost,
	})
}
