package controllers

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

const PlayerContextKey ctxKey = "player_id"

func ContentGuard(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims := &UserClaims{}
		
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return secretKey, nil
		})
		if err != nil || !token.Valid {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), PlayerContextKey, claims.PlayerID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}