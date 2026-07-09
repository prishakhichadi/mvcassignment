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

func LootResources(tx *sqlx.Tx, defenderID string, wantGold, wantElixir int64) (goldTaken, elixirTaken int64, err error) {
	err = tx.QueryRow(`
		WITH before AS (
			SELECT gold, elixir FROM resources WHERE player_id = $1 FOR UPDATE
		)
		UPDATE resources r
		SET gold   = before.gold   - LEAST(before.gold, $2),
		    elixir = before.elixir - LEAST(before.elixir, $3)
		FROM before
		WHERE r.player_id = $1
		RETURNING LEAST(before.gold, $2), LEAST(before.elixir, $3)
	`, defenderID, wantGold, wantElixir).Scan(&goldTaken, &elixirTaken)
	return
}

func CreditResources(tx *sqlx.Tx, playerID string, gold, elixir int64) error {
	_, err := tx.Exec(`UPDATE resources SET gold = gold + $1, elixir = elixir + $2, updated_at = NOW() WHERE player_id = $3`,
		gold, elixir, playerID)
	return err
}

func SpendGold(tx *sqlx.Tx, playerID string, amount int64) (ok bool, err error) {
	result, err := tx.Exec(`UPDATE resources SET gold = gold - $1, updated_at = NOW() WHERE player_id = $2 AND gold >= $1`,
		amount, playerID)
	if err != nil {
		return false, err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return rows > 0, nil
}

func SpendElixir(tx *sqlx.Tx, playerID string, amount int64) (ok bool, err error) {
	result, err := tx.Exec(`UPDATE resources SET elixir = elixir - $1, updated_at = NOW() WHERE player_id = $2 AND elixir >= $1`,
		amount, playerID)
	if err != nil {
		return false, err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return rows > 0, nil
}
