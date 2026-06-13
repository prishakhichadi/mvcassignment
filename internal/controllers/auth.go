package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"mvcassignment/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

var secretKey = []byte("vanguard_secret_key_2026")

type AuthHandler struct {
	DB *sqlx.DB
}

type authRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type UserClaims struct {
	PlayerID string `json:"player_id"`
	jwt.RegisteredClaims
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	pID, err := models.CreateNewPlayer(h.DB, req.Username, string(hash))
	if err != nil {
		http.Error(w, "username already taken", http.StatusConflict)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"player_id": pID})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var p models.Player
	query := "SELECT id, username, password, created_at FROM players WHERE username = $1"
	err := h.DB.Get(&p, query, req.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(p.Password), []byte(req.Password)); err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	//token valid for 24 hours
	expires := time.Now().Add(24 * time.Hour)
	claims := &UserClaims{
		PlayerID: p.ID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expires),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString(secretKey)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token":   tokenStr,
		"expires": expires.Format(time.RFC3339),
	})
}
