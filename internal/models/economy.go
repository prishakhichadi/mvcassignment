package models

import (
	"time"

	"github.com/jmoiron/sqlx"
)

type Resources struct {
	ID        string    `db:"id" json:"id"`
	PlayerID  string    `db:"player_id" json:"player_id"`
	Gold      int64     `db:"gold" json:"gold"`
	Elixir    int64     `db:"elixir" json:"elixir"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

func GetPlayerResources(db *sqlx.DB, playerID string) (*Resources, error) {
	var r Resources
	query := `SELECT id, player_id, gold, elixir, updated_at FROM resources WHERE player_id = $1`
	if err := db.Get(&r, query, playerID); err != nil {
		return nil, err
	}
	return &r, nil
}