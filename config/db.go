/*Go needs a factory file that tells it how to talk to PostgreSQL instance running inside Docker container.*/

package config

import (
	"fmt"
	"log"
	"os"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" //Go loads PostgreSQL driver
)

// ConnectDB fn creates a connection so controllers can talk to Postgres
func ConnectDB() *sqlx.DB {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "password"),
		getEnv("DB_NAME", "mvcassignment"),
	)

	// sqlx.Connect checks the connection
	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to establish database connection: %v", err)
	}

	log.Println("Successfully connected to the PostgreSQL database container.")
	return db
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}