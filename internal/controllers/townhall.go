package controllers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"mvcassignment/internal/models"
)

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

	newLevel, goldSpent, err := models.UpgradeTownHall(tx, playerID)
	if err != nil {
		switch e := err.(type) {
		case models.ErrTownHallMaxed:
			http.Error(w, "Town Hall is already at max level (4)", http.StatusBadRequest)
		case models.ErrNotEnoughBuildings:
			http.Error(w, fmt.Sprintf("Build at least %d defenses before upgrading Town Hall (you have %d)", e.Required, e.Have), http.StatusBadRequest)
		case models.ErrNotEnoughGold:
			http.Error(w, "Not enough gold", http.StatusPaymentRequired)
		default:
			if err == sql.ErrNoRows {
				http.Error(w, "Town not found", http.StatusNotFound)
				return
			}
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}

	if err := tx.Commit(); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":     "success",
		"message":    fmt.Sprintf("Town Hall upgraded to level %d", newLevel),
		"town_level": newLevel,
		"gold_spent": goldSpent,
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

	info, err := models.GetTownHallStatus(tc.DB, playerID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Town not found", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}
