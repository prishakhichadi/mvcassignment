package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"
)

type HistoryController struct {
	DB *sqlx.DB
}

func (hc *HistoryController) GetRaidLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	playerID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Define a lightweight anonymous struct to hold the log output lines cleanly
	var history []struct {
		ID           string `db:"id" json:"id"`
		AttackerID   string `db:"attacker_id" json:"attacker_id"`
		DefenderID   string `db:"defender_id" json:"defender_id"`
		Stars        int    `db:"stars" json:"stars"`
		Outcome      string `db:"outcome" json:"outcome"`
		DestrPct     int    `db:"destr_pct" json:"destruction_percentage"`
		GoldLooted   int64  `db:"gold_looted" json:"gold_looted"`
		ElixirLooted int64  `db:"elixir_looted" json:"elixir_looted"`
	}

	// Fixed the ORDER BY syntax and replaced rows scan with sqlx.Select
	query := `
		SELECT id, attacker_id, defender_id, stars, outcome, destr_pct, gold_looted, elixir_looted 
		FROM battles 
		WHERE attacker_id = $1 OR defender_id = $1 
		ORDER BY start_time DESC`

	if err := hc.DB.Select(&history, query, playerID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}
