package models

import "time"

type ScheduleBlock struct {
	ID             string  `json:"id"`
	ProfessionalID string  `json:"professional_id"`
	LocationID     *string `json:"location_id,omitempty"`
	StartTime      time.Time `json:"start_time"`
	EndTime        time.Time `json:"end_time"`
	BlockReason    *string `json:"block_reason,omitempty"`
}
