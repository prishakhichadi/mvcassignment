package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/types"
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
		INSERT INTO players (id, username, password, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())`,
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

	resID := uuid.New().String()
	_, err = tx.Exec(`
		INSERT INTO resources (id, player_id, gold, elixir, updated_at)
		VALUES ($1, $2, 10000, 10000, NOW())`,
		resID, pID)
	if err != nil {
		return "", err
	}

	return pID, tx.Commit()
}

func GetPlayerByUsername(db *sqlx.DB, username string) (*Player, error) {
	var p Player
	query := "SELECT id, username, password, created_at FROM players WHERE username = $1"
	if err := db.Get(&p, query, username); err != nil {
		return nil, err
	}
	return &p, nil
}

func GetPlayerProfile(db *sqlx.DB, playerID string) (*types.ProfileOut, error) {
	var player struct {
		ID       string `db:"id"`
		Username string `db:"username"`
	}
	if err := db.Get(&player, `SELECT id, username FROM players WHERE id = $1`, playerID); err != nil {
		return nil, err
	}

	res, err := GetPlayerResources(db, playerID)
	if err != nil {
		return nil, err
	}

	var stats PlayerStats
	if err := db.Get(&stats, `SELECT player_id, wins_attack, wins_defense, trophy_count FROM player_stats WHERE player_id = $1`, playerID); err != nil {
		return nil, err
	}

	return &types.ProfileOut{
		PlayerID: player.ID,
		Username: player.Username,
		Resources: types.ResourcesOut{
			Gold:   res.Gold,
			Elixir: res.Elixir,
		},
		Stats: types.PlayerStatsOut{
			WinsAttack:  stats.WinsAttack,
			WinsDefense: stats.WinsDefense,
			Trophies:    stats.TrophyCount,
		},
	}, nil
}
