package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type Player struct {
	ID        string    `db:"id" json:"id"`
	Username  string    `db:"username" json:"username"`
	Password  string    `db:"password" json:"-"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type PlayerStats struct {
	PlayerID    string `db:"player_id" json:"player_id"`
	WinsAttack  int    `db:"wins_attack" json:"wins_attack"`
	WinsDefense int    `db:"wins_defense" json:"wins_defense"`
	TrophyCount int    `db:"trophy_count" json:"trophy_count"`
}