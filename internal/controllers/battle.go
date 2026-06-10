package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jmoiron/sqlx"
)

type BattleController struct {
	DB *sqlx.DB
}

// AttackRandomOpponent executes matchmaking, runs the battle simulation, and processes loot
func (bc *BattleController) AttackRandomOpponent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// 1. Authenticate the attacker using the middleware session context
	attackerID, ok := r.Context().Value(PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Begin an isolated database transaction block
	tx, err := bc.DB.Beginx()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// 2. MATCHMAKING: Query an eligible target profile who isn't the attacker
	var defender struct {
		PlayerID string `db:"player_id"`
		Gold     int64  `db:"gold"`
		Elixir   int64  `db:"elixir"`
	}
	matchQuery := `
		SELECT r.player_id, r.gold, r.elixir 
		FROM resources r
		WHERE r.player_id != $1 
		ORDER BY RANDOM() LIMIT 1`

	if err := tx.Get(&defender, matchQuery, attackerID); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "No active rival opponents found for matchmaking search", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// 3. COMBAT ENGINE: Sum up total troop quantity available to the attacker
	var totalTroops int
	troopQuery := `SELECT COALESCE(SUM(quantity), 0) FROM player_troop WHERE player_id = $1`
	if err := tx.Get(&totalTroops, troopQuery, attackerID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if totalTroops == 0 {
		http.Error(w, "Your army barracks are empty! Train troops before attacking.", http.StatusBadRequest)
		return
	}

	// 4. DEFENSE EVALUATION: Count total structural assets defending the target town
	var totalBuildings int
	buildingQuery := `
		SELECT COUNT(*) 
		FROM town_buildings tb
		JOIN town t ON tb.town_id = t.id
		WHERE t.player_id = $1`
	if err := tx.Get(&totalBuildings, buildingQuery, defender.PlayerID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// 5. SIMULATE FORMULA: Determine outcome based on offense vs defense forces
	var destrPct int
	var stars int
	var outcome string

	if totalBuildings == 0 || totalTroops > (totalBuildings*3) {
		destrPct = 100
		stars = 3
		outcome = "WIN"
	} else {
		// Partial victory or loss depending on army deployment size
		destrPct = (totalTroops * 100) / (totalBuildings * 3)
		if destrPct > 100 {
			destrPct = 99
		}
		
		if destrPct >= 50 && destrPct < 70 {
			stars = 1
			outcome = "WIN"
		} else if destrPct >= 70 {
			stars = 2
			outcome = "WIN"
		} else {
			stars = 0
			outcome = "LOSS"
		}
	}

	// Calculate 20% resource looting ratios on available enemy balances
	goldLooted := int64(float64(defender.Gold) * 0.20 * (float64(destrPct) / 100.0))
	elixirLooted := int64(float64(defender.Elixir) * 0.20 * (float64(destrPct) / 100.0))

	// 6. RESOURCE TRANSFER: Debit defender, credit attacker
	updateAttackerRes := `UPDATE resources SET gold = gold + $1, elixir = elixir + $2 WHERE player_id = $3`
	if _, err := tx.Exec(updateAttackerRes, goldLooted, elixirLooted, attackerID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	updateDefenderRes := `UPDATE resources SET gold = gold - $1, elixir = elixir - $2 WHERE player_id = $3`
	if _, err := tx.Exec(updateDefenderRes, goldLooted, elixirLooted, defender.PlayerID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// 7. STATISTICS UPDATE: Record trophies and wins metrics
	var trophyChange int = 0
	if outcome == "WIN" {
		trophyChange = stars * 10
		if _, err := tx.Exec(`UPDATE player_stats SET wins_attack = wins_attack + 1, trophy_count = trophy_count + $1 WHERE player_id = $2`, trophyChange, attackerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if _, err := tx.Exec(`UPDATE player_stats SET wins_defense = wins_defense + 1 WHERE player_id = $1`, defender.PlayerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	// 8. INFRASTRUCTURE TAX: Army spends itself during tactical combat deployment
	if _, err := tx.Exec(`DELETE FROM player_troop WHERE player_id = $1`, attackerID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// 9. AUDIT RECORDING: Commit log instance row straight to battles table
	battleLog, _ := json.Marshal(map[string]interface{}{"simulated_at": time.Now().String(), "strategy": "all_out_raid"})
	insertBattleRecord := `
		INSERT INTO battles (id, attacker_id, defender_id, stars, outcome, start_time, end_time, log, gold_looted, elixir_looted, destr_pct)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)`
	
	if _, err := tx.Exec(insertBattleRecord, attackerID, defender.PlayerID, stars, outcome, battleLog, goldLooted, elixirLooted, destrPct); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"matchmaking_status": "Opponent Found!",
		"target_player_id":   defender.PlayerID,
		"simulation_result": map[string]interface{}{
			"outcome":        outcome,
			"stars_earned":   stars,
			"destruction_pc": destrPct,
		},
		"resources_looted": map[string]int64{
			"gold":   goldLooted,
			"elixir": elixirLooted,
		},
		"trophies_gained": trophyChange,
	})
}