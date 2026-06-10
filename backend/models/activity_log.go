package models

import "time"

type ActivityLog struct {
	ID         string    `json:"id"`
	UserID     *string   `json:"user_id,omitempty"`
	Action     string    `json:"action"`
	EntityType *string   `json:"entity_type,omitempty"`
	EntityID   *string   `json:"entity_id,omitempty"`
	Metadata   *string   `json:"metadata,omitempty"`
	IPAddress  *string   `json:"ip_address,omitempty"`
	UserAgent  *string   `json:"user_agent,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}
