package config

import (
	"log"
	"os"
	"strings"
)

const devJWTSecret = "zilobook-dev-secret-change-in-prod"

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
	CORSOrigins []string

	// Telegram bot (notifications). Empty token disables the whole subsystem.
	TelegramBotToken    string
	TelegramBotUsername string

	// Token durations in minutes
	AccessTokenTTL  int
	RefreshTokenTTL int
}

func Load() *Config {
	// Refuse to start production with the well-known dev secret.
	if os.Getenv("GIN_MODE") == "release" && getEnv("JWT_SECRET", devJWTSecret) == devJWTSecret {
		log.Fatal("JWT_SECRET must be set to a non-default value in production (GIN_MODE=release)")
	}

	return &Config{
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://postgres:secret@localhost:5432/zilobook?sslmode=disable"),
		JWTSecret:       getEnv("JWT_SECRET", devJWTSecret),
		Port:                getEnv("PORT", "8080"),
		CORSOrigins:         splitOrigins(getEnv("CORS_ORIGIN", "http://localhost:3000")),
		TelegramBotToken:    getEnv("TELEGRAM_BOT_TOKEN", ""),
		TelegramBotUsername: getEnv("TELEGRAM_BOT_USERNAME", ""),
		AccessTokenTTL:      15,    // 15 minutes
		RefreshTokenTTL:     10080, // 7 days
	}
}

// splitOrigins parses a comma-separated CORS_ORIGIN value, e.g.
// "https://nails.zilobook.com,https://fit.zilobook.com,https://app.zilobook.com"
func splitOrigins(raw string) []string {
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return origins
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
