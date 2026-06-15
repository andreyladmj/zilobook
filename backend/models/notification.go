package models

import "time"

// Notification delivery channels.
const (
	ChannelTelegram = "telegram"
	ChannelSMS      = "sms"
)

// Notification types.
const (
	NotifBookingConfirmation = "booking_confirmation"
	NotifReminder            = "reminder"
	NotifNewBooking          = "new_booking"
	NotifCancellation        = "cancellation"
)

// Notification statuses (dispatch queue lifecycle).
const (
	NotifPending = "pending" // awaiting dispatch
	NotifSent    = "sent"    // delivered
	NotifFailed  = "failed"  // delivery error, may retry
	NotifSkipped = "skipped" // undeliverable (e.g. user never linked Telegram)
)

type Notification struct {
	ID            string     `json:"id"`
	UserID        string     `json:"user_id"`
	AppointmentID *string    `json:"appointment_id,omitempty"`
	Type          string     `json:"type"`
	Channel       string     `json:"channel"`
	Title         string     `json:"title"`
	Body          string     `json:"body"`
	Status        string     `json:"status"`
	ScheduledFor  *time.Time `json:"scheduled_for,omitempty"`
	Attempts      int        `json:"attempts"`
	SentAt        *time.Time `json:"sent_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

// TelegramAccount links an app user to their Telegram chat.
type TelegramAccount struct {
	UserID   string    `json:"user_id"`
	ChatID   int64     `json:"chat_id"`
	Username string    `json:"username"`
	LinkedAt time.Time `json:"linked_at"`
}
