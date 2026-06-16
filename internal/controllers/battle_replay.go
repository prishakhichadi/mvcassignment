package controllers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/jmoiron/sqlx"
)

type BattleReplay struct {
	ID              string      `db:"id" json:"battle_id"`
	AttackerID      string      `db:"attacker_id" json:"attacker_id"`
	DefenderID      string      `db:"defender_id" json:"defender_id"`
	Stars           int         `db:"stars" json:"stars"`
	Outcome         string      `db:"outcome" json:"outcome"`
	GoldLooted      int64       `db:"gold_looted" json:"gold_looted"`
	ElixirLooted    int64       `db:"elixir_looted" json:"elixir_looted"`
	DestrPct        int         `db:"destr_pct" json:"destruction_pct"`
	Log             interface{} `db:"log" json:"battle_log"`
	DefenseSnapshot interface{} `db:"defense_snapshot" json:"defense_snapshot"`
}

func GetBattleReplay(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		playerID, ok := r.Context().Value(PlayerContextKey).(string)
		if !ok || playerID == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		battleID := strings.TrimSpace(r.URL.Query().Get("id"))

		if battleID != "" {
			var replay BattleReplay
			query := `
				SELECT id, attacker_id, defender_id, stars, outcome, gold_looted, elixir_looted, destr_pct, log, defense_snapshot
				FROM battles
				WHERE id = $1 AND (attacker_id = $2 OR defender_id = $2)`

			if err := db.Get(&replay, query, battleID, playerID); err != nil {
				http.Error(w, "Battle not found", http.StatusNotFound)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(replay)
			return
		}

	}
}
