package models

import (
	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/types"
)

func GetLeaderboard(db *sqlx.DB) ([]types.LeaderboardEntry, error) {
	var entries []types.LeaderboardEntry
	query := `
		SELECT ps.player_id, p.username, ps.trophy_count, ps.wins_attack, ps.wins_defense
		FROM player_stats ps
		JOIN players p ON ps.player_id = p.id
		ORDER BY ps.trophy_count DESC`
	if err := db.Select(&entries, query); err != nil {
		return nil, err
	}
	return entries, nil
}
