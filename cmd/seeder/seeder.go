/*this file writes rules into the database*/

package main

import (
	"encoding/json"
	"log"
	"mvcassignment/config"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

func main() {
	db := config.ConnectDB()
	defer db.Close()

	log.Println("beginning database seeding")
	seedTroops(db)
	seedBuildings(db)
	log.Println("database seeding complete")
}

func seedTroops(db *sqlx.DB) {
	_, _ = db.Exec("DELETE FROM troop_info")

	troops := []struct {
		Name      string
		Space     int
		LevelInfo map[string]interface{}
	}{
		{
			Name: "Barbarian", Space: 1,
			LevelInfo: map[string]interface{}{
				"1": map[string]interface{}{"hp": 45, "dps": 8, "cost_elixir": 25},
				"2": map[string]interface{}{"hp": 54, "dps": 11, "cost_elixir": 40},
				"3": map[string]interface{}{"hp": 65, "dps": 14, "cost_elixir": 60},
				"4": map[string]interface{}{"hp": 78, "dps": 18, "cost_elixir": 100},
			},
		},
		{
			Name: "Archer", Space: 1,
			LevelInfo: map[string]interface{}{
				"1": map[string]interface{}{"hp": 20, "dps": 7, "cost_elixir": 50},
				"2": map[string]interface{}{"hp": 23, "dps": 9, "cost_elixir": 80},
				"3": map[string]interface{}{"hp": 28, "dps": 12, "cost_elixir": 120},
				"4": map[string]interface{}{"hp": 33, "dps": 16, "cost_elixir": 200},
			},
		},
		{
			Name: "Goblin", Space: 1,
			LevelInfo: map[string]interface{}{
				"1": map[string]interface{}{"hp": 25, "dps": 11, "cost_elixir": 25},
				"2": map[string]interface{}{"hp": 30, "dps": 14, "cost_elixir": 40},
				"3": map[string]interface{}{"hp": 36, "dps": 19, "cost_elixir": 70},
				"4": map[string]interface{}{"hp": 43, "dps": 24, "cost_elixir": 120},
			},
		},
		{
			Name: "Giant", Space: 5,
			LevelInfo: map[string]interface{}{
				"1": map[string]interface{}{"hp": 300, "dps": 11, "cost_elixir": 250},
				"2": map[string]interface{}{"hp": 360, "dps": 14, "cost_elixir": 350},
				"3": map[string]interface{}{"hp": 430, "dps": 19, "cost_elixir": 500},
				"4": map[string]interface{}{"hp": 520, "dps": 24, "cost_elixir": 750},
			},
		},
		{
			Name: "Wall Breaker", Space: 2,
			LevelInfo: map[string]interface{}{
				"1": map[string]interface{}{"hp": 20, "dps": 12, "cost_elixir": 1000},
				"2": map[string]interface{}{"hp": 24, "dps": 16, "cost_elixir": 1500},
				"3": map[string]interface{}{"hp": 29, "dps": 24, "cost_elixir": 2000},
				"4": map[string]interface{}{"hp": 35, "dps": 32, "cost_elixir": 2500},
			},
		},
	}

	for _, t := range troops {
		bytes, _ := json.Marshal(t.LevelInfo)
		_, err := db.Exec("INSERT INTO troop_info (id, name, space, level_info, created_at) VALUES ($1, $2, $3, $4, NOW())",
			uuid.New().String(), t.Name, t.Space, string(bytes))
		if err != nil {
			log.Fatalf("Failed seeding troop %s: %v", t.Name, err)
		}
	}
}

func seedBuildings(db *sqlx.DB) {
	_, _ = db.Exec("DELETE FROM building_info")

	buildings := []struct {
		Name      string
		TownLevel int
		Type      string
		LevelInfo map[string]interface{}
	}{
		{
			Name: "Cannon", TownLevel: 1, Type: "defense",
			LevelInfo: map[string]interface{}{
				"1": map[string]interface{}{"hp": 400, "dps": 9, "cost_gold": 250},
				"2": map[string]interface{}{"hp": 450, "dps": 11, "cost_gold": 500},
				"3": map[string]interface{}{"hp": 500, "dps": 15, "cost_gold": 1000},
				"4": map[string]interface{}{"hp": 570, "dps": 19, "cost_gold": 2000},
			},
		},
		{
			Name: "Archer Tower", TownLevel: 2, Type: "defense",
			LevelInfo: map[string]interface{}{
				"1": map[string]interface{}{"hp": 380, "dps": 11, "cost_gold": 1000},
				"2": map[string]interface{}{"hp": 420, "dps": 14, "cost_gold": 2000},
				"3": map[string]interface{}{"hp": 460, "dps": 17, "cost_gold": 4000},
				"4": map[string]interface{}{"hp": 510, "dps": 20, "cost_gold": 8000},
			},
		},
		{
			Name: "Air Defense", TownLevel: 3, Type: "defense",
			LevelInfo: map[string]interface{}{
				"1": map[string]interface{}{"hp": 800, "dps": 20, "cost_gold": 4000},
				"2": map[string]interface{}{"hp": 900, "dps": 30, "cost_gold": 8000},
				"3": map[string]interface{}{"hp": 1000, "dps": 40, "cost_gold": 16000},
				"4": map[string]interface{}{"hp": 1100, "dps": 50, "cost_gold": 32000},
			},
		},
		{
			Name: "Town Hall", TownLevel: 1, Type: "townhall",
			LevelInfo: map[string]interface{}{
				"1": map[string]interface{}{"hp": 1500, "capacity_gold": 1000},
				"2": map[string]interface{}{"hp": 1600, "capacity_gold": 2500},
				"3": map[string]interface{}{"hp": 1850, "capacity_gold": 5000},
				"4": map[string]interface{}{"hp": 2100, "capacity_gold": 10000},
			},
		},
	}

	for _, b := range buildings {
		bytes, _ := json.Marshal(b.LevelInfo)
		_, err := db.Exec("INSERT INTO building_info (id, name, town_level, type, level_info) VALUES ($1, $2, $3, $4, $5)",
			uuid.New().String(), b.Name, b.TownLevel, b.Type, string(bytes))
		if err != nil {
			log.Fatalf("Failed seeding building %s: %v", b.Name, err)
		}
	}
}