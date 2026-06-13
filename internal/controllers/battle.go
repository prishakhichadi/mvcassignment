package controllers

import (
	"database/sql"
	"encoding/json"
	"math/rand"
	"net/http"

	"github.com/jmoiron/sqlx"
)

func ExecuteRaid(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		attackerID, ok := r.Context().Value(PlayerContextKey).(string)
		if !ok || attackerID == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		tx, err := db.Beginx()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		//matchmaking
		var targetProfile struct {
			TownID   string `db:"id"`        // Aligns with 'id' column in town table
			PlayerID string `db:"player_id"` // Aligns with 'player_id' column in town table
		}
		findTarget := `SELECT id, player_id FROM town WHERE player_id != $1 LIMIT 1`
		if err := tx.Get(&targetProfile, findTarget, attackerID); err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "No available matching rival targets found.", http.StatusNotFound)
				return
			}
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		//defense
		var buildingCount int
		countDefenses := `SELECT COUNT(*) FROM town_buildings WHERE town_id = $1`
		if err := tx.Get(&buildingCount, countDefenses, targetProfile.TownID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		//offense
		var troopCount int
		countTroops := `SELECT COALESCE(SUM(quantity), 0) FROM player_troop WHERE player_id = $1`
		if err := tx.Get(&troopCount, countTroops, attackerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if troopCount == 0 {
			http.Error(w, "Your base camp is empty! Train some forces before raiding.", http.StatusBadRequest)
			return
		}

		//calc
		destruction := rand.Intn(101) // Generate score scale from 0 to 100%

		var scoreStars int
		var raidOutcome string

		if destruction >= 100 {
			scoreStars = 3
			raidOutcome = "win"
		} else if destruction >= 50 {
			scoreStars = 2
			raidOutcome = "win"
		} else if destruction > 0 {
			scoreStars = 1
			raidOutcome = "win"
		} else {
			scoreStars = 0
			raidOutcome = "loss"
		}

		//gold elixir fractions
		lootedGold := int64(destruction * 100)
		lootedElixir := int64(destruction * 100)

		//update resources
		updateAttacker := `UPDATE resources SET gold = gold + $1, elixir = elixir + $2 WHERE player_id = $3`
		if _, err := tx.Exec(updateAttacker, lootedGold, lootedElixir, attackerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		//del used troop
		clearBarracks := `DELETE FROM player_troop WHERE player_id = $1`
		if _, err := tx.Exec(clearBarracks, attackerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		//record matchmaking in battles table
		metadata, _ := json.Marshal(map[string]interface{}{"mode": "automatic_simulation", "troops_deployed": troopCount})
		emptySnapshot := []byte(`[]`)

		insertLog := `
			INSERT INTO battles (id, attacker_id, defender_id, stars, outcome, start_time, end_time, log, gold_looted, elixir_looted, destr_pct, defense_snapshot)
			VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8, $9)`

		if _, err := tx.Exec(insertLog, attackerID, targetProfile.PlayerID, scoreStars, raidOutcome, metadata, lootedGold, lootedElixir, destruction, emptySnapshot); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		//commit
		if err := tx.Commit(); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		//0output
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"search_status": "Target Acquired",
			"enemy_id":      targetProfile.PlayerID,
			"combat_summary": map[string]interface{}{
				"outcome":          raidOutcome,
				"stars":            scoreStars,
				"destruction_rate": destruction,
			},
			"loot_secured": map[string]interface{}{
				"gold_looted":   lootedGold,
				"elixir_looted": lootedElixir,
			},
		})
	}
}
