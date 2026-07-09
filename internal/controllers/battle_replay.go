package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/models"
)

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
		if battleID == "" {
			return
		}

		replay, err := models.GetBattleReplay(db, playerID, battleID)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Battle not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Battle not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(replay)
	}
}
