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

type regResponse struct {
	PlayerID string `json:"player_id"`
}

type loginResponse struct {
	Token   string `json:"token"`
	Expires string `json:"expires"`
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
	json.NewEncoder(w).Encode(regResponse{PlayerID: pID})
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
	err := h.DB.Get(&p, "SELECT id, username, password, created_at FROM players WHERE username = $1", req.Username)
	if err == sql.ErrNoRows || bcrypt.CompareHashAndPassword([]byte(p.Password), []byte(req.Password)) != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	} else if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	expires := time.Now().Add(24 * time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &UserClaims{
		PlayerID: p.ID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expires),
		},
	})

	tokenStr, err := token.SignedString(secretKey)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(loginResponse{
		Token:   tokenStr,
		Expires: expires.Format(time.RFC3339),
	})
}
