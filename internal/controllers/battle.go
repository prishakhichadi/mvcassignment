package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"
)

type deployedTroopReq struct {
	TroopName string `json:"troop_name"`
	Quantity  int    `json:"quantity"`
}

type attackRequest struct {
	Troops []deployedTroopReq `json:"troops"`
}

type enemyBuildingOut struct {
	Name      string `json:"name"`
	X         int    `json:"x"`
	Y         int    `json:"y"`
	Level     int    `json:"level"`
	MaxHP     int    `json:"max_hp"`
	HP        int    `json:"hp"`
	Destroyed bool   `json:"destroyed"`
}

type defBuildingRow struct {
	Name      string `db:"name"`
	X         int    `db:"x"`
	Y         int    `db:"y"`
	Level     int    `db:"level"`
	LevelInfo string `db:"level_info"`
}

type playerTroopRow struct {
	TroopInfoID string `db:"troop_info_id"`
	Name        string `db:"name"`
	Quantity    int    `db:"quantity"`
	Level       int    `db:"level"`
	LevelInfo   string `db:"level_info"`
}

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

		var req attackRequest
		if r.Body != nil {
			_ = json.NewDecoder(r.Body).Decode(&req) // ignore decode errors -- empty body is valid
		}

		tx, err := db.Beginx()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

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

		var ownedTroops []playerTroopRow
		if err := tx.Select(&ownedTroops, `
			SELECT pt.troop_info_id, ti.name, pt.quantity, pt.level, ti.level_info
			FROM player_troop pt
			JOIN troop_info ti ON ti.id = pt.troop_info_id
			WHERE pt.player_id = $1 AND pt.quantity > 0`, attackerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if len(ownedTroops) == 0 {
			http.Error(w, "Train some troops before attacking", http.StatusBadRequest)
			return
		}

		ownedByName := map[string]*playerTroopRow{}
		for i := range ownedTroops {
			t := &ownedTroops[i]
			ownedByName[t.Name] = t
		}

		type deployedTroop struct {
			TroopInfoID string
			Name        string
			Quantity    int
			DPS         float64
		}
		var deployed []deployedTroop
		totalDeployedCount := 0

		addDeployed := func(row *playerTroopRow, qty int) {
			if qty <= 0 {
				return
			}
			var stats map[string]map[string]any
			_ = json.Unmarshal([]byte(row.LevelInfo), &stats)
			levelKey := itoa(row.Level)
			dps := 0.0
			if lvl, ok := stats[levelKey]; ok {
				if v, ok := lvl["dps"]; ok {
					dps = toFloat(v)
				}
			}
			deployed = append(deployed, deployedTroop{
				TroopInfoID: row.TroopInfoID,
				Name:        row.Name,
				Quantity:    qty,
				DPS:         dps,
			})
			totalDeployedCount += qty
		}

		if len(req.Troops) > 0 {
			for _, reqT := range req.Troops {
				owned, exists := ownedByName[reqT.TroopName]
				if !exists {
					continue
				}
				qty := reqT.Quantity
				if qty > owned.Quantity {
					qty = owned.Quantity
				}
				addDeployed(owned, qty)
			}
		} else {
			for i := range ownedTroops {
				addDeployed(&ownedTroops[i], ownedTroops[i].Quantity)
			}
		}

		if totalDeployedCount == 0 {
			http.Error(w, "Select at least one troop to deploy", http.StatusBadRequest)
			return
		}

		var totalAttackerDPS float64
		for _, d := range deployed {
			totalAttackerDPS += d.DPS * float64(d.Quantity)
		}

		var defRows []defBuildingRow
		if err := tx.Select(&defRows, `
			SELECT bi.name, tb.x, tb.y, tb.level, bi.level_info
			FROM town_buildings tb
			JOIN building_info bi ON bi.id = tb.building_info_id
			WHERE tb.town_id = $1`, target.TownID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		type liveBuilding struct {
			Name  string
			X, Y  int
			Level int
			MaxHP int
			HP    float64
		}
		var liveBuildings []liveBuilding
		var totalDefenderHP float64

		for _, b := range defRows {
			var stats map[string]map[string]any
			_ = json.Unmarshal([]byte(b.LevelInfo), &stats)
			levelKey := itoa(b.Level)
			maxHP := 0
			if lvl, ok := stats[levelKey]; ok {
				if v, ok := lvl["hp"]; ok {
					maxHP = int(toFloat(v))
				}
			}
			liveBuildings = append(liveBuildings, liveBuilding{
				Name: b.Name, X: b.X, Y: b.Y, Level: b.Level, MaxHP: maxHP, HP: float64(maxHP),
			})
			totalDefenderHP += float64(maxHP)
		}

		//no buildings placed at all- treat as a full undefended win,

		if len(liveBuildings) == 0 || totalDefenderHP == 0 {
			liveBuildings = nil
		}

		const engagementSeconds = 45.0
		damageBudget := totalAttackerDPS * engagementSeconds

		buildingsDestroyed := 0
		for i := range liveBuildings {
			if damageBudget <= 0 {
				break
			}
			b := &liveBuildings[i]
			if damageBudget >= b.HP {
				damageBudget -= b.HP
				b.HP = 0
			} else {
				b.HP -= damageBudget
				damageBudget = 0
			}
			if b.HP <= 0 {
				buildingsDestroyed++
			}
		}

		destruction := 0
		if len(liveBuildings) > 0 {
			destruction = int((float64(buildingsDestroyed) / float64(len(liveBuildings))) * 100)
		} else {
			destruction = 100
		}
		if destruction > 100 {
			destruction = 100
		}

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

		var defenderGold int64
		var defenderElixir int64

		err = tx.QueryRow(
			`
		SELECT gold, elixir
		FROM resources
		WHERE player_id = $1
		FOR UPDATE
		`,
			target.PlayerID,
		).Scan(&defenderGold, &defenderElixir)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if lootedGold > defenderGold {
			lootedGold = defenderGold
		}

		if lootedElixir > defenderElixir {
			lootedElixir = defenderElixir
		}

		_, err = tx.Exec(`
		UPDATE resources
		SET gold = gold - $1,
			elixir = elixir - $2
		WHERE player_id = $3
		`,
			lootedGold,
			lootedElixir,
			target.PlayerID,
		)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec(`
		UPDATE resources
		SET gold = gold + $1,
			elixir = elixir + $2
		WHERE player_id = $3
		`,
			lootedGold,
			lootedElixir,
			attackerID,
		)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if outcome == "win" {
			tx.Exec(`UPDATE player_stats SET wins_attack = wins_attack + 1, trophy_count = trophy_count + $1 WHERE player_id = $2`, stars*10, attackerID)
			tx.Exec(`UPDATE player_stats SET wins_defense = wins_defense + 1 WHERE player_id = $1`, target.PlayerID)
		}

		for _, d := range deployed {
			tx.Exec(`UPDATE player_troop SET quantity = quantity - $1 WHERE player_id = $2 AND troop_info_id = $3`,
				d.Quantity, attackerID, d.TroopInfoID)
		}
		tx.Exec(`DELETE FROM player_troop WHERE player_id = $1 AND quantity <= 0`, attackerID)

		//record battle
		metadata, _ := json.Marshal(map[string]interface{}{
			"mode":             "combat_resolution",
			"troops_deployed":  totalDeployedCount,
			"building_count":   len(liveBuildings),
			"attacker_dps":     totalAttackerDPS,
			"defender_max_hp":  totalDefenderHP,
			"buildings_killed": buildingsDestroyed,
		})

		if _, err := tx.Exec(`
			INSERT INTO battles (id, attacker_id, defender_id, stars, outcome, start_time, end_time, log, gold_looted, elixir_looted, destr_pct, defense_snapshot)
			VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8, $9)`,
			attackerID, target.PlayerID, stars, outcome, metadata, lootedGold, lootedElixir, destruction, []byte(`[]`)); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

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

		var outBuildings []enemyBuildingOut
		for _, b := range liveBuildings {
			outBuildings = append(outBuildings, enemyBuildingOut{
				Name:      b.Name,
				X:         b.X,
				Y:         b.Y,
				Level:     b.Level,
				MaxHP:     b.MaxHP,
				HP:        int(b.HP),
				Destroyed: b.HP <= 0,
			})
		}

		var outDeployed []deployedTroopReq
		for _, d := range deployed {
			outDeployed = append(outDeployed, deployedTroopReq{TroopName: d.Name, Quantity: d.Quantity})
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
			"enemy_id":        target.PlayerID,
			"enemy_buildings": outBuildings,
			"deployed_troops": outDeployed,
		})
	}
}

// helpers
func itoa(n int) string {
	if n <= 0 {
		return "1"
	}
	digits := "0123456789"
	if n < 10 {
		return string(digits[n])
	}

	var buf []byte
	for n > 0 {
		buf = append([]byte{digits[n%10]}, buf...)
		n /= 10
	}
	return string(buf)
}

func toFloat(v any) float64 {
	switch x := v.(type) {
	case float64:
		return x
	case int:
		return float64(x)
	case int64:
		return float64(x)
	default:
		return 0
	}
}
