package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/models"
)

func GetLeaderboard(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		entries, err := models.GetLeaderboard(db)
		if err != nil {
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
