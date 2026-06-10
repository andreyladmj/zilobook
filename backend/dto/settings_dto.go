package dto

type UpdateSettingsRequest struct {
	Theme                   *string `json:"theme"`
	Language                *string `json:"language"`
	Timezone                *string `json:"timezone"`
	Currency                *string `json:"currency"`
	AllowClientSelfBooking  *bool   `json:"allow_client_self_booking"`
	RequireBookingApproval  *bool   `json:"require_booking_approval"`
	MinBookingLeadHours     *int    `json:"min_booking_lead_hours"`
	MaxBookingAdvanceDays   *int    `json:"max_booking_advance_days"`
	SlotDurationMinutes     *int    `json:"slot_duration_minutes"`
	SlotGapMinutes          *int    `json:"slot_gap_minutes"`
	MaxDailyAppointments    *int    `json:"max_daily_appointments"`
	CancellationWindowHours *int    `json:"cancellation_window_hours"`
	NotifyNewBooking        *bool   `json:"notify_new_booking"`
	NotifyCancellation      *bool   `json:"notify_cancellation"`
	NotifyReminderHours     *int    `json:"notify_reminder_hours"`
	NotifyViaSMS            *bool   `json:"notify_via_sms"`
	NotifyViaPush           *bool   `json:"notify_via_push"`
	NotifyViaEmail          *bool   `json:"notify_via_email"`
	ShowPhoneToPro          *bool   `json:"show_phone_to_pro"`
	AutoConfirmRebooking    *bool   `json:"auto_confirm_rebooking"`
}

type SettingsResponse struct {
	Theme                   string `json:"theme"`
	Language                string `json:"language"`
	Timezone                string `json:"timezone"`
	Currency                string `json:"currency"`
	AllowClientSelfBooking  bool   `json:"allow_client_self_booking"`
	RequireBookingApproval  bool   `json:"require_booking_approval"`
	MinBookingLeadHours     int    `json:"min_booking_lead_hours"`
	MaxBookingAdvanceDays   int    `json:"max_booking_advance_days"`
	SlotDurationMinutes     int    `json:"slot_duration_minutes"`
	SlotGapMinutes          int    `json:"slot_gap_minutes"`
	MaxDailyAppointments    *int   `json:"max_daily_appointments"`
	CancellationWindowHours int    `json:"cancellation_window_hours"`
	NotifyNewBooking        bool   `json:"notify_new_booking"`
	NotifyCancellation      bool   `json:"notify_cancellation"`
	NotifyReminderHours     int    `json:"notify_reminder_hours"`
	NotifyViaSMS            bool   `json:"notify_via_sms"`
	NotifyViaPush           bool   `json:"notify_via_push"`
	NotifyViaEmail          bool   `json:"notify_via_email"`
	ShowPhoneToPro          bool   `json:"show_phone_to_pro"`
	AutoConfirmRebooking    bool   `json:"auto_confirm_rebooking"`
}
