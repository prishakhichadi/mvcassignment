package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/jmoiron/sqlx"
)

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