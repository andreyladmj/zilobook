package services

import (
	"database/sql"

	"gymapp-backend/dto"
	"gymapp-backend/models"
	"gymapp-backend/repositories"
)

type SettingsService struct {
	settingsRepo *repositories.SettingsRepo
}

func NewSettingsService(settingsRepo *repositories.SettingsRepo) *SettingsService {
	return &SettingsService{settingsRepo: settingsRepo}
}

func (s *SettingsService) GetOrCreate(userID string) (*dto.SettingsResponse, error) {
	settings, err := s.settingsRepo.FindByUserID(userID)
	if err == sql.ErrNoRows {
		settings = &models.UserSettings{UserID: userID}
		if err := s.settingsRepo.Create(settings); err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	return s.toResponse(settings), nil
}

func (s *SettingsService) Update(userID string, req dto.UpdateSettingsRequest) (*dto.SettingsResponse, error) {
	settings, err := s.settingsRepo.FindByUserID(userID)
	if err == sql.ErrNoRows {
		settings = &models.UserSettings{UserID: userID}
		if err := s.settingsRepo.Create(settings); err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	// Apply partial updates
	if req.Theme != nil {
		settings.Theme = *req.Theme
	}
	if req.Language != nil {
		settings.Language = *req.Language
	}
	if req.Timezone != nil {
		settings.Timezone = *req.Timezone
	}
	if req.Currency != nil {
		settings.Currency = *req.Currency
	}
	if req.AllowClientSelfBooking != nil {
		settings.AllowClientSelfBooking = *req.AllowClientSelfBooking
	}
	if req.RequireBookingApproval != nil {
		settings.RequireBookingApproval = *req.RequireBookingApproval
	}
	if req.MinBookingLeadHours != nil {
		settings.MinBookingLeadHours = *req.MinBookingLeadHours
	}
	if req.MaxBookingAdvanceDays != nil {
		settings.MaxBookingAdvanceDays = *req.MaxBookingAdvanceDays
	}
	if req.SlotDurationMinutes != nil {
		settings.SlotDurationMinutes = *req.SlotDurationMinutes
	}
	if req.SlotGapMinutes != nil {
		settings.SlotGapMinutes = *req.SlotGapMinutes
	}
	if req.MaxDailyAppointments != nil {
		settings.MaxDailyAppointments = req.MaxDailyAppointments
	}
	if req.CancellationWindowHours != nil {
		settings.CancellationWindowHours = *req.CancellationWindowHours
	}
	if req.NotifyNewBooking != nil {
		settings.NotifyNewBooking = *req.NotifyNewBooking
	}
	if req.NotifyCancellation != nil {
		settings.NotifyCancellation = *req.NotifyCancellation
	}
	if req.NotifyReminderHours != nil {
		settings.NotifyReminderHours = *req.NotifyReminderHours
	}
	if req.NotifyViaSMS != nil {
		settings.NotifyViaSMS = *req.NotifyViaSMS
	}
	if req.NotifyViaPush != nil {
		settings.NotifyViaPush = *req.NotifyViaPush
	}
	if req.NotifyViaEmail != nil {
		settings.NotifyViaEmail = *req.NotifyViaEmail
	}
	if req.ShowPhoneToPro != nil {
		settings.ShowPhoneToPro = *req.ShowPhoneToPro
	}
	if req.AutoConfirmRebooking != nil {
		settings.AutoConfirmRebooking = *req.AutoConfirmRebooking
	}

	if err := s.settingsRepo.Update(settings); err != nil {
		return nil, err
	}

	return s.toResponse(settings), nil
}

func (s *SettingsService) toResponse(m *models.UserSettings) *dto.SettingsResponse {
	return &dto.SettingsResponse{
		Theme:                   m.Theme,
		Language:                m.Language,
		Timezone:                m.Timezone,
		Currency:                m.Currency,
		AllowClientSelfBooking:  m.AllowClientSelfBooking,
		RequireBookingApproval:  m.RequireBookingApproval,
		MinBookingLeadHours:     m.MinBookingLeadHours,
		MaxBookingAdvanceDays:   m.MaxBookingAdvanceDays,
		SlotDurationMinutes:     m.SlotDurationMinutes,
		SlotGapMinutes:          m.SlotGapMinutes,
		MaxDailyAppointments:    m.MaxDailyAppointments,
		CancellationWindowHours: m.CancellationWindowHours,
		NotifyNewBooking:        m.NotifyNewBooking,
		NotifyCancellation:      m.NotifyCancellation,
		NotifyReminderHours:     m.NotifyReminderHours,
		NotifyViaSMS:            m.NotifyViaSMS,
		NotifyViaPush:           m.NotifyViaPush,
		NotifyViaEmail:          m.NotifyViaEmail,
		ShowPhoneToPro:          m.ShowPhoneToPro,
		AutoConfirmRebooking:    m.AutoConfirmRebooking,
	}
}
