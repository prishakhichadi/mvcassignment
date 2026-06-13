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

/*type StructurePlacementRequest struct {

    BuildingName string `json:"building_name"`

    X            int    `json:"x"`

    Y            int    `json:"y"`

}*/

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

	//town details
	var town models.Town
	if err := tc.DB.Get(&town, "SELECT id, player_id, level, created_at FROM town WHERE player_id = $1", playerID); err != nil {
		http.Error(w, "Town records not initialized for this account", http.StatusNotFound)
		return
	}

	//get gold/elixir balances
	var resources models.Resources
	if err := tc.DB.Get(&resources, "SELECT id, player_id, gold, elixir, updated_at FROM resources WHERE player_id = $1", playerID); err != nil {
		http.Error(w, "Resource records missing for this account", http.StatusInternalServerError)
		return
	}

	//get player records
	var stats models.PlayerStats
	if err := tc.DB.Get(&stats, "SELECT player_id, wins_attack, wins_defense, trophy_count FROM player_stats WHERE player_id = $1", playerID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	//layout grid
	buildings, err := models.GetTownBuildings(tc.DB, town.ID)
	if err != nil {
		http.Error(w, "Failed to compile grid layout coordinate map", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"player_id":  playerID,
		"town_id":    town.ID,
		"town_level": town.Level,
		"current_balance": map[string]int64{
			"gold":   resources.Gold,
			"elixir": resources.Elixir,
		},
		"player_stats": map[string]int{
			"attacks_won":  stats.WinsAttack,
			"defenses_won": stats.WinsDefense,
			"trophies":     stats.TrophyCount,
		},
		"deployed_layout": buildings,
	})
}

func (tc *TownController) PlaceStructure(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "structure placed!",
	})
}
