package models

import "time"

type WorkingHours struct {
	ID             string     `json:"id"`
	ProfessionalID string     `json:"professional_id"`
	LocationID     string     `json:"location_id"`
	DayOfWeek      int        `json:"day_of_week"`
	StartTime      string     `json:"start_time"`
	EndTime        string     `json:"end_time"`
	ValidFrom      time.Time  `json:"valid_from"`
	ValidUntil     *time.Time `json:"valid_until,omitempty"`
}
