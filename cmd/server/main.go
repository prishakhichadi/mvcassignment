package main

import (
	"log"
	"mvcassignment/config"
	"mvcassignment/internal/controllers"
	"net/http"
)

func main() {
	dbConn := config.ConnectDB()

	defer dbConn.Close()

	auth := &controllers.AuthHandler{DB: dbConn}
	town := &controllers.TownController{DB: dbConn}
	troop := &controllers.TroopController{DB: dbConn}
	/*
		// auth
		http.HandleFunc("/register", auth.Register)
		http.HandleFunc("/login", auth.Login)

		// town
		http.HandleFunc("/town/layout", controllers.ContentGuard(town.GetLayout))
		http.HandleFunc("/town/place", controllers.ContentGuard(town.PlaceStructure))

		// troops
		http.HandleFunc("/troop/train", controllers.ContentGuard(troop.TrainUnitsInstant))
		http.HandleFunc("/troop/attack", controllers.ContentGuard(controllers.ExecuteRaid(dbConn)))

		// leaderboard + replay
		http.HandleFunc("/leaderboard", controllers.GetLeaderboard(dbConn))
		http.HandleFunc("/battle/replay", controllers.ContentGuard(controllers.GetBattleReplay(dbConn)))
	*/

	http.HandleFunc("/register", controllers.CORSMiddleware(auth.Register))
	http.HandleFunc("/login", controllers.CORSMiddleware(auth.Login))
	http.HandleFunc("/town/layout", controllers.CORSMiddleware(controllers.ContentGuard(town.GetLayout)))
	http.HandleFunc("/town/place", controllers.CORSMiddleware(controllers.ContentGuard(town.PlaceStructure)))
	http.HandleFunc("/troop/train", controllers.CORSMiddleware(controllers.ContentGuard(troop.TrainUnitsInstant)))
	http.HandleFunc("/troop/attack", controllers.CORSMiddleware(controllers.ContentGuard(controllers.ExecuteRaid(dbConn))))
	http.HandleFunc("/leaderboard", controllers.CORSMiddleware(controllers.GetLeaderboard(dbConn)))
	http.HandleFunc("/battle/replay", controllers.CORSMiddleware(controllers.ContentGuard(controllers.GetBattleReplay(dbConn))))

	log.Println("vanguard API processing traffic on port:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
