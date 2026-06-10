package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	_ "github.com/lib/pq"
)

func Connect(connStr string) (*sql.DB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connection established")
	return db, nil
}

func RunMigrations(db *sql.DB, migrationsDir string) error {
	log.Println("Running database migrations...")

	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.up.sql"))
	if err != nil {
		return fmt.Errorf("failed to find migrations: %w", err)
	}

	sort.Strings(files)

	for _, file := range files {
		content, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read migration %s: %w", file, err)
		}

		// Execute entire migration file as one statement block
		// Split on semicolons but handle multi-statement migrations
		queries := strings.Split(string(content), ";")
		for _, query := range queries {
			q := strings.TrimSpace(query)
			if q == "" {
				continue
			}
			if _, err = db.Exec(q); err != nil {
				// Skip "already exists" errors for idempotent migrations
				if strings.Contains(err.Error(), "already exists") {
					continue
				}
				log.Printf("Migration warning in %s: %v", filepath.Base(file), err)
			}
		}
		log.Printf("Applied migration: %s", filepath.Base(file))
	}

	log.Println("Database migrations complete")
	return nil
}
