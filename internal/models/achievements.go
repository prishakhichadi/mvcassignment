package models

import "github.com/jmoiron/sqlx"

func AwardAchievementOnce(tx *sqlx.Tx, playerID, achievementType string) error {
	var existing int
	if err := tx.Get(&existing, `SELECT COUNT(*) FROM achievements_log WHERE player_id = $1 AND type = $2`, playerID, achievementType); err != nil {
		return err
	}
	if existing > 0 {
		return nil
	}
	_, err := tx.Exec(`INSERT INTO achievements_log (id, player_id, type, created_at) VALUES (gen_random_uuid(), $1, $2, NOW())`,
		playerID, achievementType)
	return err
}
