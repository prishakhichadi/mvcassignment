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
	/*battle := &controllers.BattleController{DB: dbConn}*/

	http.HandleFunc("/register", auth.Register)
	http.HandleFunc("/login", auth.Login)

	http.HandleFunc("/town/layout", controllers.ContentGuard(town.GetLayout))
	http.HandleFunc("/town/place", controllers.ContentGuard(town.PlaceStructure))
	http.HandleFunc("/troop/train", controllers.ContentGuard(troop.TrainUnitsInstant))
	http.HandleFunc("/troop/attack", controllers.ContentGuard(controllers.ExecuteRaid(dbConn)))

	log.Println("vanguard API processing traffic on port:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
