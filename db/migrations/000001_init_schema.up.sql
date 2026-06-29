CREATE TYPE battle_outcome AS ENUM ('win', 'loss', 'draw');
CREATE TYPE building_type AS ENUM ('resource', 'defense', 'army', 'townhall');
CREATE TYPE achievement_type AS ENUM ('first_win', 'resources_looted', 'troops_trained', 'buildings_upgraded');

CREATE TABLE "players"(
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "password" CHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE "players" ADD PRIMARY KEY("id");

CREATE TABLE "player_stats"(
    "player_id" UUID NOT NULL,
    "wins_attack" INTEGER NOT NULL DEFAULT 0,
    "wins_defense" INTEGER NOT NULL DEFAULT 0,
    "trophy_count" INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE "player_stats" ADD PRIMARY KEY("player_id");

CREATE TABLE "town"(
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_id" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE "town" ADD PRIMARY KEY("id");

CREATE TABLE "building_info"(
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "town_level" INTEGER NOT NULL,
    "type" building_type NOT NULL,
    "level_info" JSON NOT NULL
);
ALTER TABLE "building_info" ADD PRIMARY KEY("id");

CREATE TABLE "town_buildings"(
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "town_id" UUID NOT NULL,
    "building_info_id" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL
);
ALTER TABLE "town_buildings" ADD PRIMARY KEY("id");

CREATE TABLE "troop_info"(
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "space" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "level_info" JSON NOT NULL
);
ALTER TABLE "troop_info" ADD PRIMARY KEY("id");

CREATE TABLE "player_troop"(
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_id" UUID NOT NULL,
    "troop_info_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE "player_troop" ADD PRIMARY KEY("id");

ALTER TABLE "player_troop" ADD CONSTRAINT "player_troop_unique" UNIQUE (player_id, troop_info_id, level);

CREATE TABLE "resources"(
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_id" UUID NOT NULL,
    "gold" BIGINT NOT NULL DEFAULT 0,
    "elixir" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE "resources" ADD PRIMARY KEY("id");

CREATE TABLE "battles"(
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attacker_id" UUID NOT NULL,
    "defender_id" UUID NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "outcome" battle_outcome NOT NULL,
    "start_time" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "end_time" TIMESTAMP(0) WITHOUT TIME ZONE,
    "log" JSON,
    "gold_looted" BIGINT NOT NULL DEFAULT 0,
    "elixir_looted" BIGINT NOT NULL DEFAULT 0,
    "destr_pct" INTEGER NOT NULL DEFAULT 0,
    "defense_snapshot" JSON
);
ALTER TABLE "battles" ADD PRIMARY KEY("id");

CREATE TABLE "troop_record"(
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "battle_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "troop_info_id" UUID NOT NULL,
    "level" INTEGER NOT NULL
);
ALTER TABLE "troop_record" ADD PRIMARY KEY("id");

CREATE TABLE "achievements_log"(
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_id" UUID NOT NULL,
    "type" achievement_type NOT NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE "achievements_log" ADD PRIMARY KEY("id");

-- Foreign keys
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_foreign" FOREIGN KEY("player_id") REFERENCES "players"("id");
ALTER TABLE "town" ADD CONSTRAINT "town_player_id_foreign" FOREIGN KEY("player_id") REFERENCES "players"("id");
ALTER TABLE "resources" ADD CONSTRAINT "resources_player_id_foreign" FOREIGN KEY("player_id") REFERENCES "players"("id");
ALTER TABLE "player_troop" ADD CONSTRAINT "player_troop_player_id_foreign" FOREIGN KEY("player_id") REFERENCES "players"("id");
ALTER TABLE "player_troop" ADD CONSTRAINT "player_troop_troop_info_id_foreign" FOREIGN KEY("troop_info_id") REFERENCES "troop_info"("id");
ALTER TABLE "achievements_log" ADD CONSTRAINT "achievements_log_player_id_foreign" FOREIGN KEY("player_id") REFERENCES "players"("id");
ALTER TABLE "town_buildings" ADD CONSTRAINT "town_buildings_town_id_foreign" FOREIGN KEY("town_id") REFERENCES "town"("id");
ALTER TABLE "town_buildings" ADD CONSTRAINT "town_buildings_building_info_id_foreign" FOREIGN KEY("building_info_id") REFERENCES "building_info"("id");
ALTER TABLE "battles" ADD CONSTRAINT "battles_attacker_id_foreign" FOREIGN KEY("attacker_id") REFERENCES "players"("id");
ALTER TABLE "battles" ADD CONSTRAINT "battles_defender_id_foreign" FOREIGN KEY("defender_id") REFERENCES "players"("id");
ALTER TABLE "troop_record" ADD CONSTRAINT "troop_record_battle_id_foreign" FOREIGN KEY("battle_id") REFERENCES "battles"("id");
ALTER TABLE "troop_record" ADD CONSTRAINT "troop_record_troop_info_id_foreign" FOREIGN KEY("troop_info_id") REFERENCES "troop_info"("id");

ALTER TABLE resources
ADD CONSTRAINT gold_non_negative
CHECK (gold >= 0);

ALTER TABLE resources
ADD CONSTRAINT elixir_non_negative
CHECK (elixir >= 0);