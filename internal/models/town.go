package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type Town struct {
	ID        string    `db:"id" json:"id"`
	PlayerID  string    `db:"player_id" json:"player_id"`
	Level     int       `db:"level" json:"level"` // Limits values cleanly from 1 to 4
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type TownBuilding struct {
	ID             string `db:"id" json:"id"`
	TownID         string `db:"town_id" json:"town_id"`
	BuildingInfoID string `db:"building_info_id" json:"building_info_id"`
	Level          int    `db:"level" json:"level"`
	X              int    `db:"x" json:"x"` // Coordinate on our 2D grid matrix
	Y              int    `db:"y" json:"y"` // Coordinate on our 2D grid matrix
}

type BuildingInfo struct {
	ID        string    `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	TownLevel int       `db:"town_level" json:"town_level"`
	Type      string    `db:"type" json:"type"` // townhall, resource, defense
	LevelInfo LevelJSON `db:"level_info" json:"level_info"`
}

// LevelJSON converts complex Postgres database JSON data into readable Go maps
type LevelJSON map[string]interface{}

func (l LevelJSON) Value() (driver.Value, error) {
	return json.Marshal(l)
}

func (l *1LevelJSON) Scan(src interface{}) error {
	source, ok := src.([]byte)
	if !ok {
		return errors.New("type assertion failed")
	}
	return json.Unmarshal(source, l)
}