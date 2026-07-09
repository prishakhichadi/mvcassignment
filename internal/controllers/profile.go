package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/models"
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

	profile, err := models.GetPlayerProfile(pc.DB, playerID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Player not found", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}