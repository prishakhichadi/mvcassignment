package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"

	"mvcassignment/internal/models"
	"mvcassignment/internal/types"
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

		var req types.AttackRequest
		if r.Body != nil {
			_ = json.NewDecoder(r.Body).Decode(&req)
		}

		tx, err := db.Beginx()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		target, err := models.GetRandomOpponent(tx, attackerID)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "No opponents available", http.StatusNotFound)
				return
			}
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		ownedTroops, err := models.GetOwnedTroopsForBattle(tx, attackerID)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if len(ownedTroops) == 0 {
			http.Error(w, "Train some troops before attacking", http.StatusBadRequest)
			return
		}

		ownedByName := map[string]*models.PlayerTroopRow{}
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

		addDeployed := func(row *models.PlayerTroopRow, qty int) {
			if qty <= 0 {
				return
			}
			stats, _ := models.ParseLevelInfo(row.LevelInfo)
			dps := stats.Float(row.Level, "dps")
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

		defRows, err := models.GetDefenderBuildings(tx, target.TownID)
		if err != nil {
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
			stats, _ := models.ParseLevelInfo(b.LevelInfo)
			maxHP := stats.Int(b.Level, "hp")
			liveBuildings = append(liveBuildings, liveBuilding{
				Name: b.Name, X: b.X, Y: b.Y, Level: b.Level, MaxHP: maxHP, HP: float64(maxHP),
			})
			totalDefenderHP += float64(maxHP)
		}

		// no buildings placed at all-full undefended win
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

		wantGold := int64(destruction * 100)
		wantElixir := int64(destruction * 100)

		lootedGold, lootedElixir, err := models.LootResources(tx, target.PlayerID, wantGold, wantElixir)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if err := models.CreditResources(tx, attackerID, lootedGold, lootedElixir); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if outcome == "win" {
			if err := models.ApplyWinStats(tx, attackerID, target.PlayerID, stars*10); err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		}

		for _, d := range deployed {
			if err := models.ConsumeDeployedTroops(tx, attackerID, d.TroopInfoID, d.Quantity); err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		}
		if err := models.PruneEmptyTroops(tx, attackerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		record := models.BattleRecord{
			AttackerID:   attackerID,
			DefenderID:   target.PlayerID,
			Stars:        stars,
			Outcome:      outcome,
			GoldLooted:   lootedGold,
			ElixirLooted: lootedElixir,
			DestrPct:     destruction,
			Metadata: map[string]interface{}{
				"mode":             "combat_resolution",
				"troops_deployed":  totalDeployedCount,
				"building_count":   len(liveBuildings),
				"attacker_dps":     totalAttackerDPS,
				"defender_max_hp":  totalDefenderHP,
				"buildings_killed": buildingsDestroyed,
			},
		}
		if err := models.RecordBattle(tx, record); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if err := models.CheckBattleAchievements(tx, attackerID); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if err := tx.Commit(); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var outBuildings []types.EnemyBuildingOut
		for _, b := range liveBuildings {
			outBuildings = append(outBuildings, types.EnemyBuildingOut{
				Name:      b.Name,
				X:         b.X,
				Y:         b.Y,
				Level:     b.Level,
				MaxHP:     b.MaxHP,
				HP:        int(b.HP),
				Destroyed: b.HP <= 0,
			})
		}

		var outDeployed []types.DeployedTroopReq
		for _, d := range deployed {
			outDeployed = append(outDeployed, types.DeployedTroopReq{TroopName: d.Name, Quantity: d.Quantity})
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
