package config

import (
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// creates a connection so go controllers can talk to postgres
func ConnectDB() *sqlx.DB {
	dsn := "host=localhost port=5432 user=postgres password=password dbname=mvcassignment sslmode=disable"

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to establish database connection: %v", err)
	}
	log.Println("successfully connected to the PostgreSQL database container")
	return db
}

/*
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
*/
