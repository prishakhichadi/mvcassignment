package models

import "time"

type Resources struct {
	ID        string    `db:"id" json:"id"`
	PlayerID  string    `db:"player_id" json:"player_id"`
	Gold      int64     `db:"gold" json:"gold"`
	Elixir    int64     `db:"elixir" json:"elixir"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}