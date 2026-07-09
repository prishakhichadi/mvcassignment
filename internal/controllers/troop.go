package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/models"
	"mvcassignment/internal/types"
)

type TroopController struct {
	DB *sqlx.DB
}

func (tc *TroopController) TrainUnitsInstant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var req types.TrainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 {
		http.Error(w, "You must train at least 1 unit", http.StatusBadRequest)
		return
	}

	tx, err := tc.DB.Beginx()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	totalCost, err := models.TrainTroops(tx, userID, req.TroopName, req.Quantity)
	if err != nil {
		switch err.(type) {
		case models.ErrTroopNotFound:
			http.Error(w, "We don't offer that troop type in our camp barracks", http.StatusNotFound)
		case models.ErrInsufficientElixir:
			http.Error(w, "You don't have enough Elixir for this training order", http.StatusPaymentRequired)
		default:
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
		"status":       "Success",
		"message":      "Units trained and stationed in your base camp",
		"troop_name":   req.TroopName,
		"quantity":     req.Quantity,
		"elixir_spent": totalCost,
	})
}

func (tc *TroopController) ListMyTroops(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	troops, err := models.ListPlayerTroops(tc.DB, userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"troops": troops,
	})
}
