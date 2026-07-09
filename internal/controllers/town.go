package controllers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/models"
	"mvcassignment/internal/types"
)

type TownController struct {
	DB *sqlx.DB
}

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

	layout, err := models.GetTownLayout(tc.DB, playerID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Town not found", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(layout)
}

func (tc *TownController) PlaceStructure(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	playerID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var req types.PlaceStructureRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if req.X < 0 || req.X > 9 || req.Y < 0 || req.Y > 9 {
		http.Error(w, "Coordinates must be between 0 and 9", http.StatusBadRequest)
		return
	}

	tx, err := tc.DB.Beginx()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	town, err := models.GetTownByPlayer(tx, playerID)
	if err != nil {
		http.Error(w, "Town not found", http.StatusNotFound)
		return
	}

	goldSpent, err := models.PlaceBuilding(tx, playerID, town.ID, req.BuildingName, req.X, req.Y)
	if err != nil {
		switch err.(type) {
		case models.ErrNotEnoughGold:
			http.Error(w, "Not enough gold", http.StatusPaymentRequired)
		default:
			if err == sql.ErrNoRows {
				http.Error(w, "Building type not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Could not place building", http.StatusInternalServerError)
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
		"message":    fmt.Sprintf("%s placed at (%d, %d)", req.BuildingName, req.X, req.Y),
		"gold_spent": goldSpent,
	})
}
