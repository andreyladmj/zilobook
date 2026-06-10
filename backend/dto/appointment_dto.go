package dto

// --- Requests ---

type CreateAppointmentRequest struct {
	LocationID     string `json:"location_id" binding:"required"`
	ProfessionalID string `json:"professional_id" binding:"required"`
	ClientID       string `json:"client_id"`
	StartTime      string `json:"start_time" binding:"required"`
	EndTime        string `json:"end_time" binding:"required"`
	ClientNotes    string `json:"client_notes"`
}

type UpdateAppointmentStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type RescheduleRequest struct {
	StartTime string `json:"start_time" binding:"required"`
	EndTime   string `json:"end_time" binding:"required"`
}

type CreateWorkingHoursRequest struct {
	LocationID string `json:"location_id" binding:"required"`
	DayOfWeek  int    `json:"day_of_week" binding:"min=0,max=6"`
	StartTime  string `json:"start_time" binding:"required"`
	EndTime    string `json:"end_time" binding:"required"`
	ValidFrom  string `json:"valid_from"`
	ValidUntil string `json:"valid_until"`
}

type CreateBlockRequest struct {
	LocationID  string `json:"location_id"`
	StartTime   string `json:"start_time" binding:"required"`
	EndTime     string `json:"end_time" binding:"required"`
	BlockReason string `json:"block_reason"`
}

// --- Responses ---

type AppointmentResponse struct {
	ID           string  `json:"id"`
	LocationID   string  `json:"location_id"`
	LocationName string  `json:"location_name"`
	Professional MiniPro `json:"professional"`
	Client       MiniClient `json:"client"`
	StartTime    string  `json:"start_time"`
	EndTime      string  `json:"end_time"`
	Status       string  `json:"status"`
	ClientNotes  *string `json:"client_notes,omitempty"`
	CreatedAt    string  `json:"created_at"`
}

type MiniPro struct {
	ID       string `json:"id"`
	FullName string `json:"full_name"`
}

type MiniClient struct {
	ID       string  `json:"id"`
	FullName string  `json:"full_name"`
	Phone    *string `json:"phone,omitempty"`
}

type AppointmentListResponse struct {
	Appointments []AppointmentResponse `json:"appointments"`
	Total        int                   `json:"total"`
	Page         int                   `json:"page"`
	PerPage      int                   `json:"per_page"`
}

type TimeSlot struct {
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Available bool   `json:"available"`
}

type AvailabilityResponse struct {
	Date           string     `json:"date"`
	ProfessionalID string     `json:"professional_id"`
	LocationID     string     `json:"location_id"`
	Slots          []TimeSlot `json:"slots"`
}

type TodayScheduleItem struct {
	ID          string  `json:"id"`
	Hour        string  `json:"hour"`
	Client      *string `json:"client"`
	ClientPhone *string `json:"client_phone,omitempty"`
	Service     string  `json:"service"`
	Status      string  `json:"status"`
	Duration    string  `json:"duration"`
	Notes       *string `json:"notes,omitempty"`
	IsBlock     bool    `json:"is_block"`
	BlockReason *string `json:"block_reason,omitempty"`
}

type TodayScheduleResponse struct {
	Date         string               `json:"date"`
	Items        []TodayScheduleItem  `json:"items"`
	TotalToday   int                  `json:"total_today"`
	PendingCount int                  `json:"pending_count"`
}

type WorkingHoursResponse struct {
	ID         string  `json:"id"`
	LocationID string  `json:"location_id"`
	DayOfWeek  int     `json:"day_of_week"`
	StartTime  string  `json:"start_time"`
	EndTime    string  `json:"end_time"`
	ValidFrom  string  `json:"valid_from"`
	ValidUntil *string `json:"valid_until,omitempty"`
}

type BlockResponse struct {
	ID          string  `json:"id"`
	LocationID  *string `json:"location_id,omitempty"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	BlockReason *string `json:"block_reason,omitempty"`
}
