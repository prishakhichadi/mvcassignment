ALTER TABLE "troop_record" DROP CONSTRAINT IF EXISTS "troop_record_troop_info_id_foreign";
ALTER TABLE "troop_record" DROP CONSTRAINT IF EXISTS "troop_record_battle_id_foreign";
ALTER TABLE "battles" DROP CONSTRAINT IF EXISTS "battles_defender_id_foreign";
ALTER TABLE "battles" DROP CONSTRAINT IF EXISTS "battles_attacker_id_foreign";
ALTER TABLE "achievements_log" DROP CONSTRAINT IF EXISTS "achievements_log_player_id_foreign";
ALTER TABLE "town_buildings" DROP CONSTRAINT IF EXISTS "town_buildings_building_info_id_foreign";
ALTER TABLE "town_buildings" DROP CONSTRAINT IF EXISTS "town_buildings_town_id_foreign";
ALTER TABLE "player_troop" DROP CONSTRAINT IF EXISTS "player_troop_troop_info_id_foreign";
ALTER TABLE "player_troop" DROP CONSTRAINT IF EXISTS "player_troop_player_id_foreign";
ALTER TABLE "resources" DROP CONSTRAINT IF EXISTS "resources_player_id_foreign";
ALTER TABLE "town" DROP CONSTRAINT IF EXISTS "town_player_id_foreign";
ALTER TABLE "player_stats" DROP CONSTRAINT IF EXISTS "player_stats_player_id_foreign";

DROP TABLE IF EXISTS "troop_record";
DROP TABLE IF EXISTS "achievements_log";
DROP TABLE IF EXISTS "troop_info";
DROP TABLE IF EXISTS "player_troop";
DROP TABLE IF EXISTS "town_buildings";
DROP TABLE IF EXISTS "building_info";
DROP TABLE IF EXISTS "battles";
DROP TABLE IF EXISTS "resources";
DROP TABLE IF EXISTS "town";
DROP TABLE IF EXISTS "player_stats";
DROP TABLE IF EXISTS "players";

DROP TYPE IF EXISTS "battle_outcome";
DROP TYPE IF EXISTS "building_type";
DROP TYPE IF EXISTS "achievement_type";