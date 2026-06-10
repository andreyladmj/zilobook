package models

import "time"

type AppointmentStatus string

const (
	StatusConfirmed AppointmentStatus = "Confirmed"
	StatusPending   AppointmentStatus = "Pending"
	StatusCancelled AppointmentStatus = "Cancelled"
	StatusCompleted AppointmentStatus = "Completed"
	StatusNoShow    AppointmentStatus = "NoShow"
)

type Appointment struct {
	ID             string            `json:"id"`
	LocationID     string            `json:"location_id"`
	ProfessionalID string            `json:"professional_id"`
	ClientID       *string           `json:"client_id"`
	StartTime      time.Time         `json:"start_time"`
	EndTime        time.Time         `json:"end_time"`
	Status         AppointmentStatus `json:"status"`
	ClientNotes    *string           `json:"client_notes,omitempty"`
	CreatedAt      time.Time         `json:"created_at"`
}
