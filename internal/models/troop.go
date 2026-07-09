package models

import (
	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/types"
)

type TroopInfo struct {
	ID        string `db:"id"`
	Name      string `db:"name"`
	LevelInfo string `db:"level_info"`
}

type PlayerTroopRow struct {
	TroopInfoID string `db:"troop_info_id"`
	Name        string `db:"name"`
	Quantity    int    `db:"quantity"`
	Level       int    `db:"level"`
	LevelInfo   string `db:"level_info"`
}

type ErrTroopNotFound struct{}

func (ErrTroopNotFound) Error() string { return "troop type not found" }

type ErrInsufficientElixir struct{}

func (ErrInsufficientElixir) Error() string { return "not enough elixir" }

func GetTroopInfoByName(tx *sqlx.Tx, name string) (*TroopInfo, error) {
	var t TroopInfo
	if err := tx.Get(&t, "SELECT id, name, level_info FROM troop_info WHERE name = $1 LIMIT 1", name); err != nil {
		return nil, err
	}
	return &t, nil
}

func TrainTroops(tx *sqlx.Tx, playerID, troopName string, quantity int) (totalCost int64, err error) {
	troop, err := GetTroopInfoByName(tx, troopName)
	if err != nil {
		return 0, ErrTroopNotFound{}
	}

	stats, err := ParseLevelInfo(troop.LevelInfo)
	if err != nil {
		return 0, err
	}

	unitCost := stats.Int64(1, "cost_elixir")
	totalCost = unitCost * int64(quantity)

	ok, err := SpendElixir(tx, playerID, totalCost)
	if err != nil {
		return 0, err
	}
	if !ok {
		return 0, ErrInsufficientElixir{}
	}

	_, err = tx.Exec(`
        INSERT INTO player_troop (id, player_id, troop_info_id, quantity, level)
        VALUES (gen_random_uuid(), $1, $2, $3, 1)
        ON CONFLICT (player_id, troop_info_id, level)
        DO UPDATE SET quantity = player_troop.quantity + EXCLUDED.quantity`,
		playerID, troop.ID, quantity)
	if err != nil {
		return 0, err
	}

	return totalCost, nil
}

func ListPlayerTroops(db *sqlx.DB, playerID string) ([]types.TroopOut, error) {
	var rows []struct {
		Name     string `db:"name"`
		Quantity int    `db:"quantity"`
		Level    int    `db:"level"`
	}
	if err := db.Select(&rows, `
		SELECT ti.name, pt.quantity, pt.level
		FROM player_troop pt
		JOIN troop_info ti ON ti.id = pt.troop_info_id
		WHERE pt.player_id = $1 AND pt.quantity > 0
		ORDER BY ti.name`, playerID); err != nil {
		return nil, err
	}

	out := make([]types.TroopOut, 0, len(rows))
	for _, r := range rows {
		out = append(out, types.TroopOut{Name: r.Name, Quantity: r.Quantity, Level: r.Level})
	}
	return out, nil
}

func GetOwnedTroopsForBattle(tx *sqlx.Tx, playerID string) ([]PlayerTroopRow, error) {
	var rows []PlayerTroopRow
	err := tx.Select(&rows, `
		SELECT pt.troop_info_id, ti.name, pt.quantity, pt.level, ti.level_info
		FROM player_troop pt
		JOIN troop_info ti ON ti.id = pt.troop_info_id
		WHERE pt.player_id = $1 AND pt.quantity > 0`, playerID)
	return rows, err
}

func ConsumeDeployedTroops(tx *sqlx.Tx, playerID string, troopInfoID string, quantity int) error {
	_, err := tx.Exec(`UPDATE player_troop SET quantity = quantity - $1 WHERE player_id = $2 AND troop_info_id = $3`,
		quantity, playerID, troopInfoID)
	return err
}

func PruneEmptyTroops(tx *sqlx.Tx, playerID string) error {
	_, err := tx.Exec(`DELETE FROM player_troop WHERE player_id = $1 AND quantity <= 0`, playerID)
	return err
}
