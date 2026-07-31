package config

import (
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func ConnectDB() *sqlx.DB {
	dsn := "host=localhost port=5432 user=postgres password=password dbname=mvcassignment sslmode=disable"

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to establish database connection: %v", err)
	}
	log.Println("successfully connected to the PostgreSQL database container")
	return db
}
