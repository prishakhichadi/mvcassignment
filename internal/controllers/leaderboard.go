package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"
)

type LeaderboardEntry struct {
	PlayerID    string `db:"player_id" json:"player_id"`
	Username    string `db:"username" json:"username"`
	TrophyCount int    `db:"trophy_count" json:"trophy_count"`
	WinsAttack  int    `db:"wins_attack" json:"wins_attack"`
	WinsDefense int    `db:"wins_defense" json:"wins_defense"`
}

func GetLeaderboard(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var entries []LeaderboardEntry
		query := `
			SELECT ps.player_id, p.username, ps.trophy_count, ps.wins_attack, ps.wins_defense
			FROM player_stats ps
			JOIN players p ON ps.player_id = p.id
			ORDER BY ps.trophy_count DESC
			`

		if err := db.Select(&entries, query); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"leaderboard": entries,
			"total":       len(entries),
		})
	}
}
