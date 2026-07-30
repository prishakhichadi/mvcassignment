package types

import "encoding/json"

type AuthRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type TrainRequest struct {
	TroopName string `json:"troop_name"`
	Quantity  int    `json:"quantity"`
}

type TroopOut struct {
	Name     string `json:"name"`
	Quantity int    `json:"quantity"`
	Level    int    `json:"level"`
}

type PlaceStructureRequest struct {
	BuildingName string `json:"building_name"`
	X            int    `json:"x"`
	Y            int    `json:"y"`
}

type DeployedTroopReq struct {
	TroopName string `json:"troop_name"`
	Quantity  int    `json:"quantity"`
	X         int    `json:"x"`
	Y         int    `json:"y"`
}

type AttackRequest struct {
	EnemyID string             `json:"enemy_id"`
	Troops  []DeployedTroopReq `json:"troops"`
}

type OpponentOut struct {
	PlayerID    string `db:"player_id" json:"player_id"`
	Username    string `db:"username" json:"username"`
	TownLevel   int    `db:"town_level" json:"town_level"`
	TrophyCount int    `db:"trophy_count" json:"trophy_count"`
	Buildings   int    `db:"buildings" json:"buildings_count"`
	Shielded    bool   `db:"shielded" json:"shielded"`
}

type ScoutBuildingOut struct {
	Name string `db:"name" json:"name"`
	X    int    `db:"x" json:"x"`
	Y    int    `db:"y" json:"y"`
}

type EnemyBuildingOut struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	X         int    `json:"x"`
	Y         int    `json:"y"`
	Level     int    `json:"level"`
	MaxHP     int    `json:"max_hp"`
	HP        int    `json:"hp"`
	Destroyed bool   `json:"destroyed"`
}

type LeaderboardEntry struct {
	PlayerID    string `db:"player_id" json:"player_id"`
	Username    string `db:"username" json:"username"`
	TrophyCount int    `db:"trophy_count" json:"trophy_count"`
	WinsAttack  int    `db:"wins_attack" json:"wins_attack"`
	WinsDefense int    `db:"wins_defense" json:"wins_defense"`
}

type BattleReplay struct {
	ID              string          `db:"id" json:"battle_id"`
	AttackerID      string          `db:"attacker_id" json:"attacker_id"`
	DefenderID      string          `db:"defender_id" json:"defender_id"`
	Stars           int             `db:"stars" json:"stars"`
	Outcome         string          `db:"outcome" json:"outcome"`
	GoldLooted      int64           `db:"gold_looted" json:"gold_looted"`
	ElixirLooted    int64           `db:"elixir_looted" json:"elixir_looted"`
	DestrPct        int             `db:"destr_pct" json:"destruction_pct"`
	Log             json.RawMessage `db:"log" json:"battle_log"`
	DefenseSnapshot json.RawMessage `db:"defense_snapshot" json:"defense_snapshot"`
}

type ProfileOut struct {
	PlayerID  string         `json:"player_id"`
	Username  string         `json:"username"`
	Resources ResourcesOut   `json:"resources"`
	Stats     PlayerStatsOut `json:"stats"`
}

type ResourcesOut struct {
	Gold   int64 `json:"gold"`
	Elixir int64 `json:"elixir"`
}

type PlayerStatsOut struct {
	WinsAttack  int `json:"wins_attack"`
	WinsDefense int `json:"wins_defense"`
	Trophies    int `json:"trophies"`
}

type TownLayoutOut struct {
	PlayerID        string         `json:"player_id"`
	TownID          string         `json:"town_id"`
	TownLevel       int            `json:"town_level"`
	Resources       ResourcesOut   `json:"resources"`
	Stats           PlayerStatsOut `json:"stats"`
	Grid            [][]string     `json:"grid"`
	PendingGold     int64          `json:"pending_gold"`
	PendingElixir   int64          `json:"pending_elixir"`
	ShieldExpiresAt *string        `json:"shield_expires_at,omitempty"`
}

type TownHallInfoOut struct {
	TownLevel        int    `json:"town_level"`
	BuildingsPlaced  int    `json:"buildings_placed"`
	MaxLevel         int    `json:"max_level"`
	NextLevel        *int   `json:"next_level,omitempty"`
	NextGoldCost     *int64 `json:"next_gold_cost,omitempty"`
	NextMinBuildings *int   `json:"next_min_buildings,omitempty"`
}
