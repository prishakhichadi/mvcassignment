package main

import (
	"log"
	"mvcassignment/config"
	"mvcassignment/internal/controllers"
	"net/http"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println(".env not found")
	}
	dbConn := config.ConnectDB()

	defer dbConn.Close()

	auth := &controllers.AuthHandler{DB: dbConn}
	town := &controllers.TownController{DB: dbConn}
	troop := &controllers.TroopController{DB: dbConn}
	player := &controllers.PlayerController{DB: dbConn}        // NEW: backs /player/profile
	loginLimiter := controllers.NewRateLimiter(5, time.Minute) // 5 attempts/min/IP

	http.HandleFunc("/register", controllers.CORSMiddleware(loginLimiter.Middleware(auth.Register)))
	http.HandleFunc("/login", controllers.CORSMiddleware(loginLimiter.Middleware(auth.Login)))
	http.HandleFunc("/player/profile", controllers.CORSMiddleware(controllers.ContentGuard(player.GetProfile))) // NEW
	http.HandleFunc("/town/layout", controllers.CORSMiddleware(controllers.ContentGuard(town.GetLayout)))
	http.HandleFunc("/town/place", controllers.CORSMiddleware(controllers.ContentGuard(town.PlaceStructure)))
	http.HandleFunc("/town/hall", controllers.CORSMiddleware(controllers.ContentGuard(town.GetTownHallInfo)))         // NEW
	http.HandleFunc("/town/hall/upgrade", controllers.CORSMiddleware(controllers.ContentGuard(town.UpgradeTownHall))) // NEW
	http.HandleFunc("/troop/train", controllers.CORSMiddleware(controllers.ContentGuard(troop.TrainUnitsInstant)))
	http.HandleFunc("/troop/list", controllers.CORSMiddleware(controllers.ContentGuard(troop.ListMyTroops)))
	http.HandleFunc("/troop/opponents", controllers.CORSMiddleware(controllers.ContentGuard(controllers.ListOpponents(dbConn)))) // NEW: choose your enemy
	http.HandleFunc("/troop/scout", controllers.CORSMiddleware(controllers.ContentGuard(controllers.ScoutTarget(dbConn))))       // NEW: preview enemy layout before deploying
	http.HandleFunc("/troop/attack", controllers.CORSMiddleware(controllers.ContentGuard(controllers.ExecuteRaid(dbConn))))
	http.HandleFunc("/leaderboard", controllers.CORSMiddleware(controllers.GetLeaderboard(dbConn)))
	http.HandleFunc("/battle/replay", controllers.CORSMiddleware(controllers.ContentGuard(controllers.GetBattleReplay(dbConn))))

	log.Println("vanguard API processing traffic on port:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
