package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/types"
)

type TownHallRequirement struct {
	GoldCost          int64
	MinBuildingsBuilt int
}

var TownHallRequirements = map[int]TownHallRequirement{
	2: {GoldCost: 3000, MinBuildingsBuilt: 1},
	3: {GoldCost: 8000, MinBuildingsBuilt: 2},
	4: {GoldCost: 20000, MinBuildingsBuilt: 3},
}

const MaxTownHallLevel = 4

type Town struct {
	ID        string    `db:"id" json:"id"`
	PlayerID  string    `db:"player_id" json:"player_id"`
	Level     int       `db:"level" json:"level"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type TownBuilding struct {
	ID             string `db:"id" json:"id"`
	TownID         string `db:"town_id" json:"town_id"`
	BuildingInfoID string `db:"building_info_id" json:"building_info_id"`
	Level          int    `db:"level" json:"level"`
	X              int    `db:"x" json:"x"`
	Y              int    `db:"y" json:"y"`
}

type BuildingInfo struct {
	ID        string    `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	TownLevel int       `db:"town_level" json:"town_level"`
	Type      string    `db:"type" json:"type"`
	LevelInfo LevelJSON `db:"level_info" json:"level_info"`
}

type LevelJSON map[string]interface{}

func (l LevelJSON) Value() (driver.Value, error) {
	return json.Marshal(l)
}

func (l *LevelJSON) Scan(src interface{}) error {
	source, ok := src.([]byte)
	if !ok {
		return errors.New("type assertion failed")
	}
	return json.Unmarshal(source, l)
}

func GetTownBuildings(db *sqlx.DB, townID string) ([]TownBuilding, error) {
	var list []TownBuilding
	query := `SELECT id, town_id, building_info_id, level, x, y FROM town_buildings WHERE town_id = $1`
	if err := db.Select(&list, query, townID); err != nil {
		return nil, err
	}
	return list, nil
}

func GetTownByPlayer(q sqlx.Queryer, playerID string) (*Town, error) {
	var t Town
	if err := sqlx.Get(q, &t, `SELECT id, player_id, level, created_at FROM town WHERE player_id = $1`, playerID); err != nil {
		return nil, err
	}
	return &t, nil
}

func CountTownBuildings(q sqlx.Queryer, townID string) (int, error) {
	var count int
	err := sqlx.Get(q, &count, `SELECT COUNT(*) FROM town_buildings WHERE town_id = $1`, townID)
	return count, err
}

func GetTownLayout(db *sqlx.DB, playerID string) (*types.TownLayoutOut, error) {
	town, err := GetTownByPlayer(db, playerID)
	if err != nil {
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

	var buildings []struct {
		Name string `db:"name"`
		X    int    `db:"x"`
		Y    int    `db:"y"`
	}
	if err := db.Select(&buildings, `
		SELECT bi.name, tb.x, tb.y
		FROM town_buildings tb
		JOIN building_info bi ON tb.building_info_id = bi.id
		WHERE tb.town_id = $1`, town.ID); err != nil {
		return nil, err
	}

	grid := make([][]string, 10)
	for i := range grid {
		grid[i] = make([]string, 10)
	}
	for _, b := range buildings {
		if b.X >= 0 && b.X < 10 && b.Y >= 0 && b.Y < 10 {
			grid[b.Y][b.X] = b.Name
		}
	}

	return &types.TownLayoutOut{
		PlayerID:  playerID,
		TownID:    town.ID,
		TownLevel: town.Level,
		Resources: types.ResourcesOut{Gold: res.Gold, Elixir: res.Elixir},
		Stats: types.PlayerStatsOut{
			WinsAttack:  stats.WinsAttack,
			WinsDefense: stats.WinsDefense,
			Trophies:    stats.TrophyCount,
		},
		Grid: grid,
	}, nil
}

func GetBuildingInfoByName(tx *sqlx.Tx, name string) (*BuildingInfo, error) {
	var b BuildingInfo
	if err := tx.Get(&b, `SELECT id, name, town_level, type, level_info FROM building_info WHERE name = $1 LIMIT 1`, name); err != nil {
		return nil, err
	}
	return &b, nil
}

type ErrNotEnoughGold struct{}

func (ErrNotEnoughGold) Error() string { return "not enough gold" }

func PlaceBuilding(tx *sqlx.Tx, playerID, townID, buildingName string, x, y int) (goldSpent int64, err error) {
	building, err := GetBuildingInfoByName(tx, buildingName)
	if err != nil {
		return 0, err
	}

	stats := toLevelInfoMap(building.LevelInfo)
	goldSpent = stats.Int64(1, "cost_gold")

	ok, err := SpendGold(tx, playerID, goldSpent)
	if err != nil {
		return 0, err
	}
	if !ok {
		return 0, ErrNotEnoughGold{}
	}

	if _, err := tx.Exec(`
		INSERT INTO town_buildings (id, town_id, building_info_id, level, x, y)
		VALUES (gen_random_uuid(), $1, $2, 1, $3, $4)`,
		townID, building.ID, x, y); err != nil {
		return 0, err
	}

	count, err := CountTownBuildings(tx, townID)
	if err != nil {
		return 0, err
	}
	if count >= 1 {
		if err := AwardAchievementOnce(tx, playerID, "buildings_upgraded"); err != nil {
			return 0, err
		}
	}

	return goldSpent, nil
}

func toLevelInfoMap(l LevelJSON) LevelInfoMap {
	out := make(LevelInfoMap, len(l))
	for k, v := range l {
		if nested, ok := v.(map[string]interface{}); ok {
			out[k] = nested
		}
	}
	return out
}

func GetTownHallStatus(db *sqlx.DB, playerID string) (*types.TownHallInfoOut, error) {
	town, err := GetTownByPlayer(db, playerID)
	if err != nil {
		return nil, err
	}

	count, err := CountTownBuildings(db, town.ID)
	if err != nil {
		return nil, err
	}

	out := &types.TownHallInfoOut{
		TownLevel:       town.Level,
		BuildingsPlaced: count,
		MaxLevel:        MaxTownHallLevel,
	}

	if town.Level < MaxTownHallLevel {
		next := town.Level + 1
		req := TownHallRequirements[next]
		out.NextLevel = &next
		out.NextGoldCost = &req.GoldCost
		out.NextMinBuildings = &req.MinBuildingsBuilt
	}

	return out, nil
}

type ErrTownHallMaxed struct{}

func (ErrTownHallMaxed) Error() string { return "Town Hall is already at max level" }

type ErrNotEnoughBuildings struct {
	Required, Have int
}

func (e ErrNotEnoughBuildings) Error() string {
	return fmt.Sprintf("need at least %d buildings, have %d", e.Required, e.Have)
}

func UpgradeTownHall(tx *sqlx.Tx, playerID string) (newLevel int, goldSpent int64, err error) {
	town, err := GetTownByPlayer(tx, playerID)
	if err != nil {
		return 0, 0, err
	}

	nextLevel := town.Level + 1
	if nextLevel > MaxTownHallLevel {
		return 0, 0, ErrTownHallMaxed{}
	}

	req := TownHallRequirements[nextLevel]

	count, err := CountTownBuildings(tx, town.ID)
	if err != nil {
		return 0, 0, err
	}
	if count < req.MinBuildingsBuilt {
		return 0, 0, ErrNotEnoughBuildings{Required: req.MinBuildingsBuilt, Have: count}
	}

	ok, err := SpendGold(tx, playerID, req.GoldCost)
	if err != nil {
		return 0, 0, err
	}
	if !ok {
		return 0, 0, ErrNotEnoughGold{}
	}

	if _, err := tx.Exec(`UPDATE town SET level = $1 WHERE id = $2`, nextLevel, town.ID); err != nil {
		return 0, 0, err
	}

	return nextLevel, req.GoldCost, nil
}
