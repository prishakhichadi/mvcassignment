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

		// matchmaking
		var target struct {
			TownID   string `db:"id"`
			PlayerID string `db:"player_id"`
		}
		if err := tx.Get(&target, `SELECT id, player_id FROM town WHERE player_id != $1 LIMIT 1`, attackerID); err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "No opponents available", http.StatusNotFound)
				return
			}
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// check attacker has troops
		var troopCount int
		if err := tx.Get(&troopCount, `SELECT COALESCE(SUM(quantity), 0) FROM player_troop WHERE player_id = $1`, attackerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if troopCount == 0 {
			http.Error(w, "Train some troops before attacking", http.StatusBadRequest)
			return
		}

		// count defender buildings
		var buildingCount int
		if err := tx.Get(&buildingCount, `SELECT COUNT(*) FROM town_buildings WHERE town_id = $1`, target.TownID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// battle simulation
		destruction := rand.Intn(101)
		var stars int
		var outcome string

		if destruction >= 100 {
			stars = 3
			outcome = "win"
		} else if destruction >= 50 {
			stars = 2
			outcome = "win"
		} else if destruction > 0 {
			stars = 1
			outcome = "win"
		} else {
			stars = 0
			outcome = "loss"
		}

		lootedGold := int64(destruction * 100)
		lootedElixir := int64(destruction * 100)

		// give loot to attacker
		if _, err := tx.Exec(`UPDATE resources SET gold = gold + $1, elixir = elixir + $2 WHERE player_id = $3`, lootedGold, lootedElixir, attackerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// update stats
		if outcome == "win" {
			tx.Exec(`UPDATE player_stats SET wins_attack = wins_attack + 1, trophy_count = trophy_count + $1 WHERE player_id = $2`, stars*10, attackerID)
			tx.Exec(`UPDATE player_stats SET wins_defense = wins_defense + 1 WHERE player_id = $1`, target.PlayerID)
		}

		// clear troops
		if _, err := tx.Exec(`DELETE FROM player_troop WHERE player_id = $1`, attackerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// record battle
		metadata, _ := json.Marshal(map[string]interface{}{
			"mode":            "automatic_simulation",
			"troops_deployed": troopCount,
			"building_count":  buildingCount,
		})

		if _, err := tx.Exec(`
			INSERT INTO battles (id, attacker_id, defender_id, stars, outcome, start_time, end_time, log, gold_looted, elixir_looted, destr_pct, defense_snapshot)
			VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8, $9)`,
			attackerID, target.PlayerID, stars, outcome, metadata, lootedGold, lootedElixir, destruction, []byte(`[]`)); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// log achievements (no ON CONFLICT since no unique constraint)
		var stats struct {
			WinsAttack  int `db:"wins_attack"`
			TrophyCount int `db:"trophy_count"`
		}
		if err := tx.Get(&stats, `SELECT wins_attack, trophy_count FROM player_stats WHERE player_id = $1`, attackerID); err == nil {
			var existing int
			if stats.WinsAttack >= 1 {
				tx.Get(&existing, `SELECT COUNT(*) FROM achievements_log WHERE player_id = $1 AND type = 'first_win'`, attackerID)
				if existing == 0 {
					tx.Exec(`INSERT INTO achievements_log (id, player_id, type, created_at) VALUES (gen_random_uuid(), $1, 'first_win', NOW())`, attackerID)
				}
			}
			if stats.TrophyCount >= 100 {
				tx.Get(&existing, `SELECT COUNT(*) FROM achievements_log WHERE player_id = $1 AND type = 'resources_looted'`, attackerID)
				if existing == 0 {
					tx.Exec(`INSERT INTO achievements_log (id, player_id, type, created_at) VALUES (gen_random_uuid(), $1, 'resources_looted', NOW())`, attackerID)
				}
			}
		}

		if err := tx.Commit(); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "battle complete",
			"result": map[string]interface{}{
				"outcome":     outcome,
				"stars":       stars,
				"destruction": destruction,
			},
			"loot": map[string]int64{
				"gold":   lootedGold,
				"elixir": lootedElixir,
			},
			"enemy_id": target.PlayerID,
		})
	}
}
