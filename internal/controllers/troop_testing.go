/*enough resources to train troop
valid troop name???????
cost calculation
qty>0
*/

package controllers

import (
	"testing"
)

func calculateTroopCost(unitCost int64, quantity int) int64 {
	return unitCost * int64(quantity)
}

func hasEnoughElixir(balance int64, totalCost int64) bool {
	return balance >= totalCost
}

func TestTroopCost_MultipleUnits(t *testing.T) {
	cost := calculateTroopCost(25, 5)
	if cost != 125 {
		t.Errorf("expected cost of 125 for 5 barbarians, got %d", cost)
	}
}

func TestTroopCost_ExpensiveTroop(t *testing.T) {
	// Wall Breaker costs 1000 elixir each
	cost := calculateTroopCost(1000, 3)
	if cost != 3000 {
		t.Errorf("expected cost of 3000 for 3 wall breakers, got %d", cost)
	}
}

func TestElixirCheck_CanAfford(t *testing.T) {
	// player has 10000 elixir, training costs 125
	canAfford := hasEnoughElixir(10000, 125)
	if !canAfford {
		t.Errorf("expected player with 10000 elixir to afford 125 elixir training")
	}
}

func TestElixirCheck_CannotAfford(t *testing.T) {
	// player has 50 elixir, training costs 125
	canAfford := hasEnoughElixir(50, 125)
	if canAfford {
		t.Errorf("expected player with 50 elixir to NOT afford 125 elixir training")
	}
}

func TestElixirCheck_ExactBalance(t *testing.T) {
	// player has exactly enough
	canAfford := hasEnoughElixir(125, 125)
	if !canAfford {
		t.Errorf("expected player with exact balance to afford training")
	}
}

func TestElixirCheck_ZeroBalance(t *testing.T) {
	canAfford := hasEnoughElixir(0, 25)
	if canAfford {
		t.Errorf("expected player with 0 elixir to NOT afford any training")
	}
}

func isValidQuantity(q int) bool {
	return q > 0
}

func TestQuantity_Zero(t *testing.T) {
	if isValidQuantity(0) {
		t.Errorf("expected 0 quantity to be invalid")
	}
}

func TestQuantity_Negative(t *testing.T) {
	if isValidQuantity(-5) {
		t.Errorf("expected negative quantity to be invalid")
	}
}

func TestQuantity_Valid(t *testing.T) {
	if !isValidQuantity(5) {
		t.Errorf("expected 5 to be a valid quantity")
	}
}
