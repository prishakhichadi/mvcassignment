/*
test star calc
loot calc
matchmaking??????????????
troop count not null check
*/

package controllers

import (
	"testing"
)

func calcOutcomeStars(destruction int) (int, string) {
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

	return stars, outcome
}

func calculateLoot(destruction int) (int64, int64) {
	gold := int64(destruction * 100)
	elixir := int64(destruction * 100)
	return gold, elixir
}

func TestBattleOutcome_FullDestruction(t *testing.T) {
	stars, outcome := calcOutcomeStars(100)
	if stars != 3 {
		t.Errorf("expected 3 stars for 100%% destruction, got %d", stars)
	}
	if outcome != "win" {
		t.Errorf("expected win for 100%% destruction, got %s", outcome)
	}
}

func TestBattleOutcome_MajorDestruction(t *testing.T) {
	stars, outcome := calcOutcomeStars(75)
	if stars != 2 {
		t.Errorf("expected 2 stars for 75%% destruction, got %d", stars)
	}
	if outcome != "win" {
		t.Errorf("expected win for 75%% destruction, got %s", outcome)
	}
}

func TestBattleOutcome_MinorDestruction(t *testing.T) {
	stars, outcome := calcOutcomeStars(25)
	if stars != 1 {
		t.Errorf("expected 1 star for 25%% destruction, got %d", stars)
	}
	if outcome != "win" {
		t.Errorf("expected win for 25%% destruction, got %s", outcome)
	}
}

func TestBattleOutcome_NoDestruction(t *testing.T) {
	stars, outcome := calcOutcomeStars(0)
	if stars != 0 {
		t.Errorf("expected 0 stars for 0%% destruction, got %d", stars)
	}
	if outcome != "loss" {
		t.Errorf("expected loss for 0%% destruction, got %s", outcome)
	}
}

func TestBattleOutcome_ExactlyFiftyPercent(t *testing.T) {
	stars, outcome := calcOutcomeStars(50)
	if stars != 2 {
		t.Errorf("expected 2 stars at exactly 50%% destruction, got %d", stars)
	}
	if outcome != "win" {
		t.Errorf("expected win at exactly 50%% destruction, got %s", outcome)
	}
}

func TestLootCalculation_NormalBattle(t *testing.T) {
	gold, elixir := calculateLoot(50)
	if gold != 5000 {
		t.Errorf("expected 5000 gold for 50%% destruction, got %d", gold)
	}
	if elixir != 5000 {
		t.Errorf("expected 5000 elixir for 50%% destruction, got %d", elixir)
	}
}

func TestLootCalculation_ZeroDestruction(t *testing.T) {
	gold, elixir := calculateLoot(0)
	if gold != 0 {
		t.Errorf("expected 0 gold for 0%% destruction, got %d", gold)
	}
	if elixir != 0 {
		t.Errorf("expected 0 elixir for 0%% destruction, got %d", elixir)
	}
}

func TestLootCalculation_FullDestruction(t *testing.T) {
	gold, elixir := calculateLoot(100)
	if gold != 10000 {
		t.Errorf("expected 10000 gold for 100%% destruction, got %d", gold)
	}
	if elixir != 10000 {
		t.Errorf("expected 10000 elixir for 100%% destruction, got %d", elixir)
	}
}

func isTroopCountValid(count int) bool {
	return count > 0
}

func TestTroopCount_EmptyArmy(t *testing.T) {
	if isTroopCountValid(0) {
		t.Errorf("expected 0 troops to be invalid")
	}
}
