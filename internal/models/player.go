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
}

type PlayerStats struct {
	PlayerID    string `db:"player_id" json:"player_id"`
	WinsAttack  int    `db:"wins_attack" json:"wins_attack"`
	WinsDefense int    `db:"wins_defense" json:"wins_defense"`
	TrophyCount int    `db:"trophy_count" json:"trophy_count"`
}

func CreateNewPlayer(db *sqlx.DB, username, passwordHash string) (string, error) {
	tx, err := db.Beginx()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	pID := uuid.New().String()

	_, err = tx.Exec(`
		INSERT INTO players (id, username, password, created_at)
		VALUES ($1, $2, $3, NOW())`,
		pID, username, passwordHash)
	if err != nil {
		return "", err
	}

	_, err = tx.Exec(`
		INSERT INTO player_stats (player_id, wins_attack, wins_defense, trophy_count)
		VALUES ($1, 0, 0, 0)`,
		pID)
	if err != nil {
		return "", err
	}

	townID := uuid.New().String()
	_, err = tx.Exec(`INSERT INTO town (id, player_id, level, created_at) VALUES ($1, $2, 1, NOW())`, townID, pID)
	if err != nil {
		return "", err
	}

	_, err = tx.Exec(`
		INSERT INTO resources (id, player_id, gold, elixir, updated_at)
		VALUES ($1, $2, 10000, 10000, NOW())`,
		uuid.New().String(), pID)
	if err != nil {
		return "", err
	}

	var thInfoID string
	err = tx.Get(&thInfoID, "SELECT id FROM building_info WHERE name = $1 AND town_level = 1 LIMIT 1", "Town Hall")
	if err == nil {
		_, err = tx.Exec(`
			INSERT INTO town_buildings (id, town_id, building_info_id, level, x, y)
			VALUES ($1, $2, $3, 1, 20, 20)`,
			uuid.New().String(), townID, thInfoID)
		if err != nil {
			return "", err
		}
	}

	return pID, tx.Commit()
}
