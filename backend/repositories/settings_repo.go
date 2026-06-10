package repositories

import (
	"database/sql"

	"gymapp-backend/models"
)

type SettingsRepo struct {
	db *sql.DB
}

func NewSettingsRepo(db *sql.DB) *SettingsRepo {
	return &SettingsRepo{db: db}
}

func (r *SettingsRepo) Create(s *models.UserSettings) error {
	return r.db.QueryRow(
		`INSERT INTO user_settings (user_id) VALUES ($1)
		 RETURNING id, theme, language, timezone, currency,
		 allow_client_self_booking, require_booking_approval,
		 min_booking_lead_hours, max_booking_advance_days,
		 slot_duration_minutes, slot_gap_minutes, max_daily_appointments,
		 cancellation_window_hours, notify_new_booking, notify_cancellation,
		 notify_reminder_hours, notify_via_sms, notify_via_push, notify_via_email,
		 show_phone_to_pro, auto_confirm_rebooking, created_at, updated_at`,
		s.UserID,
	).Scan(
		&s.ID, &s.Theme, &s.Language, &s.Timezone, &s.Currency,
		&s.AllowClientSelfBooking, &s.RequireBookingApproval,
		&s.MinBookingLeadHours, &s.MaxBookingAdvanceDays,
		&s.SlotDurationMinutes, &s.SlotGapMinutes, &s.MaxDailyAppointments,
		&s.CancellationWindowHours, &s.NotifyNewBooking, &s.NotifyCancellation,
		&s.NotifyReminderHours, &s.NotifyViaSMS, &s.NotifyViaPush, &s.NotifyViaEmail,
		&s.ShowPhoneToPro, &s.AutoConfirmRebooking, &s.CreatedAt, &s.UpdatedAt,
	)
}

func (r *SettingsRepo) FindByUserID(userID string) (*models.UserSettings, error) {
	s := &models.UserSettings{}
	err := r.db.QueryRow(
		`SELECT id, user_id, theme, language, timezone, currency,
		 allow_client_self_booking, require_booking_approval,
		 min_booking_lead_hours, max_booking_advance_days,
		 slot_duration_minutes, slot_gap_minutes, max_daily_appointments,
		 cancellation_window_hours, notify_new_booking, notify_cancellation,
		 notify_reminder_hours, notify_via_sms, notify_via_push, notify_via_email,
		 show_phone_to_pro, auto_confirm_rebooking, created_at, updated_at
		 FROM user_settings WHERE user_id = $1`,
		userID,
	).Scan(
		&s.ID, &s.UserID, &s.Theme, &s.Language, &s.Timezone, &s.Currency,
		&s.AllowClientSelfBooking, &s.RequireBookingApproval,
		&s.MinBookingLeadHours, &s.MaxBookingAdvanceDays,
		&s.SlotDurationMinutes, &s.SlotGapMinutes, &s.MaxDailyAppointments,
		&s.CancellationWindowHours, &s.NotifyNewBooking, &s.NotifyCancellation,
		&s.NotifyReminderHours, &s.NotifyViaSMS, &s.NotifyViaPush, &s.NotifyViaEmail,
		&s.ShowPhoneToPro, &s.AutoConfirmRebooking, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *SettingsRepo) Update(s *models.UserSettings) error {
	return r.db.QueryRow(
		`UPDATE user_settings SET
		 theme = $1, language = $2, timezone = $3, currency = $4,
		 allow_client_self_booking = $5, require_booking_approval = $6,
		 min_booking_lead_hours = $7, max_booking_advance_days = $8,
		 slot_duration_minutes = $9, slot_gap_minutes = $10, max_daily_appointments = $11,
		 cancellation_window_hours = $12, notify_new_booking = $13, notify_cancellation = $14,
		 notify_reminder_hours = $15, notify_via_sms = $16, notify_via_push = $17, notify_via_email = $18,
		 show_phone_to_pro = $19, auto_confirm_rebooking = $20,
		 updated_at = CURRENT_TIMESTAMP
		 WHERE user_id = $21
		 RETURNING updated_at`,
		s.Theme, s.Language, s.Timezone, s.Currency,
		s.AllowClientSelfBooking, s.RequireBookingApproval,
		s.MinBookingLeadHours, s.MaxBookingAdvanceDays,
		s.SlotDurationMinutes, s.SlotGapMinutes, s.MaxDailyAppointments,
		s.CancellationWindowHours, s.NotifyNewBooking, s.NotifyCancellation,
		s.NotifyReminderHours, s.NotifyViaSMS, s.NotifyViaPush, s.NotifyViaEmail,
		s.ShowPhoneToPro, s.AutoConfirmRebooking,
		s.UserID,
	).Scan(&s.UpdatedAt)
}
