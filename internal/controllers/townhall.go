package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

var townHallRequirements = map[int]struct {
	GoldCost          int64
	MinBuildingsBuilt int
}{
	2: {GoldCost: 3000, MinBuildingsBuilt: 1},
	3: {GoldCost: 8000, MinBuildingsBuilt: 2},
	4: {GoldCost: 20000, MinBuildingsBuilt: 3},
}

func (tc *TownController) UpgradeTownHall(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	playerID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	tx, err := tc.DB.Beginx()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var town struct {
		ID    string `db:"id"`
		Level int    `db:"level"`
	}
	if err := tx.Get(&town, `SELECT id, level FROM town WHERE player_id = $1`, playerID); err != nil {
		http.Error(w, "Town not found", http.StatusNotFound)
		return
	}

	nextLevel := town.Level + 1
	if nextLevel > 4 {
		http.Error(w, "Town Hall is already at max level (4)", http.StatusBadRequest)
		return
	}

	req := townHallRequirements[nextLevel]

	var buildingCount int
	if err := tx.Get(&buildingCount, `SELECT COUNT(*) FROM town_buildings WHERE town_id = $1`, town.ID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if buildingCount < req.MinBuildingsBuilt {
		http.Error(w, fmt.Sprintf("Build at least %d defenses before upgrading to Town Hall %d (you have %d)", req.MinBuildingsBuilt, nextLevel, buildingCount), http.StatusBadRequest)
		return
	}

	result, err := tx.Exec(`
	UPDATE resources
	SET gold = gold - $1,
		updated_at = NOW()
	WHERE player_id = $2
	AND gold >= $1
	`,
		req.GoldCost,
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

	if _, err := tx.Exec(`UPDATE town SET level = $1 WHERE id = $2`, nextLevel, town.ID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":     "success",
		"message":    fmt.Sprintf("Town Hall upgraded to level %d", nextLevel),
		"town_level": nextLevel,
		"gold_spent": req.GoldCost,
	})
}

func (tc *TownController) GetTownHallInfo(w http.ResponseWriter, r *http.Request) {
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

	var buildingCount int
	tc.DB.Get(&buildingCount, `SELECT COUNT(*) FROM town_buildings WHERE town_id = $1`, town.ID)

	resp := map[string]any{
		"town_level":       town.Level,
		"buildings_placed": buildingCount,
		"max_level":        4,
	}

	if town.Level < 4 {
		nextReq := townHallRequirements[town.Level+1]
		resp["next_level"] = town.Level + 1
		resp["next_gold_cost"] = nextReq.GoldCost
		resp["next_min_buildings"] = nextReq.MinBuildingsBuilt
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
