package controllers

import (
	"encoding/json"
	"net/http"

	"mvcassignment/internal/models"

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

	var town models.Town
	if err := tc.DB.Get(&town, "SELECT id, player_id, level, created_at FROM town WHERE player_id = $1", playerID); err != nil {
		http.Error(w, "Town records not initialized", http.StatusNotFound)
		return
	}

	var res models.Resources
	if err := tc.DB.Get(&res, "SELECT id, player_id, gold, elixir, updated_at FROM resources WHERE player_id = $1", playerID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var stats models.PlayerStats
	if err := tc.DB.Get(&stats, "SELECT player_id, wins_attack, wins_defense, trophy_count FROM player_stats WHERE player_id = $1", playerID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Fetch building locations
	var buildings []struct {
		Name string `db:"building_name"`
		X    int    `db:"x"`
		Y    int    `db:"y"`
	}
	if err := tc.DB.Select(&buildings, "SELECT building_name, x, y FROM town_buildings WHERE town_id = $1", town.ID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Create 10x10 empty matrix layout
	grid := make([][]string, 10)
	for i := range grid {
		grid[i] = make([]string, 10)
		for j := 0; j < 10; j++ {
			grid[i][j] = "EMPTY"
		}
	}

	// Map buildings onto their tiles
	for _, b := range buildings {
		if b.X >= 0 && b.X < 10 && b.Y >= 0 && b.Y < 10 {
			grid[b.Y][b.X] = b.Name
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"player_id":    playerID,
		"town_id":      town.ID,
		"town_level":   town.Level,
		"gold":         res.Gold,
		"elixir":       res.Elixir,
		"attacks_won":  stats.WinsAttack,
		"defenses_won": stats.WinsDefense,
		"trophies":     stats.TrophyCount,
		"grid_matrix":  grid,
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
		http.Error(w, "Coordinates outside 10x10 boundaries", http.StatusBadRequest)
		return
	}

	tx, err := tc.DB.Beginx()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var townID string
	if err := tx.Get(&townID, "SELECT id FROM town WHERE player_id = $1", playerID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Drop structure onto map grid
	_, err = tx.Exec("INSERT INTO town_buildings (id, town_id, building_name, x, y) VALUES (gen_random_uuid(), $1, $2, $3, $4) ON CONFLICT DO NOTHING", townID, req.BuildingName, req.X, req.Y)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Progression Milestone tracking
	var count int
	if err := tx.Get(&count, "SELECT COUNT(*) FROM town_buildings WHERE town_id = $1", townID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	buildingMilestones := []struct {
		Condition bool
		Type      string
	}{
		{count >= 1, "First Brick Placed"},
		{count >= 5, "Village Architect"},
		{count >= 10, "Fortress Builder"},
		{count >= 20, "Empire Coordinator"},
	}

	for _, m := range buildingMilestones {
		if m.Condition {
			_, _ = tx.Exec(`
				INSERT INTO achievements_log (id, player_id, type, created_at) 
				VALUES (gen_random_uuid(), $1, $2, NOW()) 
				ON CONFLICT DO NOTHING`, playerID, m.Type)
		}
	}

	if err := tx.Commit(); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":          "success",
		"message":         req.BuildingName + " placed!",
		"total_buildings": count,
	})
}
