package models

import "time"

type Player struct {
	ID          string    `db:"id" json:"id"`
	Username    string    `db:"username" json:"username"`
	Password    string    `db:"password" json:"-"` // The '-' means we never expose password hashes in JSON text
	WinsAttack  int       `db:"wins_attack" json:"wins_attack"`
	WinsDefense int       `db:"wins_defense" json:"wins_defense"`
	TrophyCount int       `db:"trophy_count" json:"trophy_count"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}