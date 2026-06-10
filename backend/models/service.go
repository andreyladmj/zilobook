package models

import "time"

type Service struct {
	ID              string    `json:"id"`
	ProfessionalID  string    `json:"professional_id"`
	Name            string    `json:"name"`
	Description     *string   `json:"description,omitempty"`
	DurationMinutes int       `json:"duration_minutes"`
	Price           float64   `json:"price"`
	Currency        string    `json:"currency"`
	IsActive        bool      `json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
}
