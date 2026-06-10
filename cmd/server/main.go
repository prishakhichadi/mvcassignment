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

	auth := &controllers.AuthHandler{DB: db}

	http.HandleFunc("/register", auth.Register)
	http.HandleFunc("/login", auth.Login)

	http.HandleFunc("/village/dashboard", controllers.ContentGuard(dashboardStub))

	log.Println("vanguard API processing traffic on port:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

// dashboardStub is a temp handler method to verify token parsing works
func dashboardStub(w http.ResponseWriter, r *http.Request) {
	pID, ok := r.Context().Value(controllers.PlayerContextKey).(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"authenticated","player_id":"` + pID + `"}`))
}