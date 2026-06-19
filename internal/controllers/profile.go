package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"
)

type PlayerController struct {
	DB *sqlx.DB
}

func (pc *PlayerController) GetProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	playerID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var player struct {
		ID       string `db:"id"`
		Username string `db:"username"`
	}
	if err := pc.DB.Get(&player, `SELECT id, username FROM players WHERE id = $1`, playerID); err != nil {
		http.Error(w, "Player not found", http.StatusNotFound)
		return
	}

	var res struct {
		Gold   int64 `db:"gold"`
		Elixir int64 `db:"elixir"`
	}
	if err := pc.DB.Get(&res, `SELECT gold, elixir FROM resources WHERE player_id = $1`, playerID); err != nil {
		http.Error(w, "Resources not found", http.StatusInternalServerError)
		return
	}

	var stats struct {
		WinsAttack  int `db:"wins_attack"`
		WinsDefense int `db:"wins_defense"`
		TrophyCount int `db:"trophy_count"`
	}
	if err := pc.DB.Get(&stats, `SELECT wins_attack, wins_defense, trophy_count FROM player_stats WHERE player_id = $1`, playerID); err != nil {
		http.Error(w, "Stats not found", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"player_id": player.ID,
		"username":  player.Username,
		"resources": map[string]int64{
			"gold":   res.Gold,
			"elixir": res.Elixir,
		},
		"stats": map[string]int{
			"wins_attack":  stats.WinsAttack,
			"wins_defense": stats.WinsDefense,
			"trophies":     stats.TrophyCount,
		},
	})
}
