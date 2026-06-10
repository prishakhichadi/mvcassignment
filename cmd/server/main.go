package main

import (
	"log"
	"net/http"

	"mvcassignment/config"
	"mvcassignment/internal/controllers"
)

func main() {
	db := config.ConnectDB()
	defer db.Close()

	authHandler := &controllers.AuthHandler{DB: db}
	townHandler := &controllers.TownController{DB: db}

	// 1. Public Authentication Endpoints
	http.HandleFunc("/register", authHandler.Register)
	http.HandleFunc("/login", authHandler.Login)

	// 2. Verified Town Layout Endpoint
	http.HandleFunc("/town/layout", controllers.ContentGuard(townHandler.GetLayout))

	// 3. TEMPORARILY COMMENTED OUT (We will uncomment these as we build them one-by-one!)
	// http.HandleFunc("/town/place", controllers.ContentGuard(townHandler.PlaceStructure))
	// armyHandler := &controllers.ArmyController{DB: db}
	// http.HandleFunc("/army/train", controllers.ContentGuard(armyHandler.TrainTroopsInstant))
	// battleHandler := &controllers.BattleController{DB: db}
	// http.HandleFunc("/town/attack", controllers.ContentGuard(battleHandler.AttackRandomOpponent))

	log.Println("vanguard API processing traffic on port:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

func dashboardStub(w http.ResponseWriter, r *http.Request) {
	playerID, ok := r.Context().Value(controllers.PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"authenticated","player_id":"` + playerID + `"}`))
}
