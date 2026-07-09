package models

import (
	"encoding/json"

	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/types"
)

type RaidTarget struct {
	TownID   string `db:"id"`
	PlayerID string `db:"player_id"`
}

type DefBuildingRow struct {
	Name      string `db:"name"`
	X         int    `db:"x"`
	Y         int    `db:"y"`
	Level     int    `db:"level"`
	LevelInfo string `db:"level_info"`
}

func GetRandomOpponent(tx *sqlx.Tx, attackerID string) (*RaidTarget, error) {
	var target RaidTarget
	err := tx.Get(&target, `SELECT id, player_id FROM town WHERE player_id != $1 LIMIT 1`, attackerID)
	if err != nil {
		return nil, err
	}
	return &target, nil
}

func GetDefenderBuildings(tx *sqlx.Tx, townID string) ([]DefBuildingRow, error) {
	var rows []DefBuildingRow
	err := tx.Select(&rows, `
		SELECT bi.name, tb.x, tb.y, tb.level, bi.level_info
		FROM town_buildings tb
		JOIN building_info bi ON bi.id = tb.building_info_id
		WHERE tb.town_id = $1`, townID)
	return rows, err
}

type BattleRecord struct {
	AttackerID   string
	DefenderID   string
	Stars        int
	Outcome      string
	GoldLooted   int64
	ElixirLooted int64
	DestrPct     int
	Metadata     map[string]interface{}
}

func RecordBattle(tx *sqlx.Tx, b BattleRecord) error {
	metadata, err := json.Marshal(b.Metadata)
	if err != nil {
		return err
	}
	_, err = tx.Exec(`
		INSERT INTO battles (id, attacker_id, defender_id, stars, outcome, start_time, end_time, log, gold_looted, elixir_looted, destr_pct, defense_snapshot)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8, $9)`,
		b.AttackerID, b.DefenderID, b.Stars, b.Outcome, metadata, b.GoldLooted, b.ElixirLooted, b.DestrPct, []byte(`[]`))
	return err
}

func ApplyWinStats(tx *sqlx.Tx, attackerID, defenderID string, trophyGain int) error {
	if _, err := tx.Exec(`UPDATE player_stats SET wins_attack = wins_attack + 1, trophy_count = trophy_count + $1 WHERE player_id = $2`,
		trophyGain, attackerID); err != nil {
		return err
	}
	_, err := tx.Exec(`UPDATE player_stats SET wins_defense = wins_defense + 1 WHERE player_id = $1`, defenderID)
	return err
}

func CheckBattleAchievements(tx *sqlx.Tx, attackerID string) error {
	var stats struct {
		WinsAttack  int `db:"wins_attack"`
		TrophyCount int `db:"trophy_count"`
	}
	if err := tx.Get(&stats, `SELECT wins_attack, trophy_count FROM player_stats WHERE player_id = $1`, attackerID); err != nil {

		return nil
	}

	if stats.WinsAttack >= 1 {
		if err := AwardAchievementOnce(tx, attackerID, "first_win"); err != nil {
			return err
		}
	}
	if stats.TrophyCount >= 100 {
		if err := AwardAchievementOnce(tx, attackerID, "resources_looted"); err != nil {
			return err
		}
	}
	return nil
}

func GetBattleReplay(db *sqlx.DB, playerID, battleID string) (*types.BattleReplay, error) {
	var replay types.BattleReplay
	query := `
		SELECT id, attacker_id, defender_id, stars, outcome, gold_looted, elixir_looted, destr_pct, log, defense_snapshot
		FROM battles
		WHERE id = $1 AND (attacker_id = $2 OR defender_id = $2)`
	if err := db.Get(&replay, query, battleID, playerID); err != nil {
		return nil, err
	}
	return &replay, nil
}
