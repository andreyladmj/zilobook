package services

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"gymapp-backend/dto"
	"gymapp-backend/models"
	"gymapp-backend/repositories"
	"gymapp-backend/utils"
)

var (
	ErrAppointmentNotFound = errors.New("appointment not found")
	ErrTimeConflict        = errors.New("time slot already booked")
	ErrInvalidTimeRange    = errors.New("end time must be after start time")
	ErrTooSoon             = errors.New("booking too close to start time")
	ErrTooFarAhead         = errors.New("booking too far in advance")
	ErrSelfBookingDisabled = errors.New("self-booking is disabled for this professional")
	ErrInvalidStatus       = errors.New("invalid status transition")
	ErrNotAuthorized       = errors.New("not authorized to modify this appointment")
)

type AppointmentService struct {
	appointmentRepo *repositories.AppointmentRepo
	scheduleRepo    *repositories.ScheduleRepo
	settingsRepo    *repositories.SettingsRepo
	userRepo        *repositories.UserRepo
	phoneRepo       *repositories.PhoneRepo
	activitySvc     *ActivityService
	notifySvc       *NotificationService
}

func NewAppointmentService(
	appointmentRepo *repositories.AppointmentRepo,
	scheduleRepo *repositories.ScheduleRepo,
	settingsRepo *repositories.SettingsRepo,
	userRepo *repositories.UserRepo,
	phoneRepo *repositories.PhoneRepo,
	activitySvc *ActivityService,
	notifySvc *NotificationService,
) *AppointmentService {
	return &AppointmentService{
		appointmentRepo: appointmentRepo,
		scheduleRepo:    scheduleRepo,
		settingsRepo:    settingsRepo,
		userRepo:        userRepo,
		phoneRepo:       phoneRepo,
		activitySvc:     activitySvc,
		notifySvc:       notifySvc,
	}
}

// notifyBooking fans out booking notifications (confirmation, reminders, pro ping).
// Runs off the request path; failures only log.
func (s *AppointmentService) notifyBooking(appointmentID, professionalID string, clientID *string, start time.Time, confirmed bool) {
	if s.notifySvc == nil {
		return
	}
	reminderHours := 2
	if st, err := s.settingsRepo.FindByUserID(professionalID); err == nil && st != nil {
		reminderHours = st.NotifyReminderHours
	}
	s.notifySvc.EnqueueBooking(appointmentID, professionalID, clientID, start, reminderHours, confirmed)
}

func (s *AppointmentService) Create(callerID, callerRole string, req dto.CreateAppointmentRequest, ip, ua string) (*dto.AppointmentResponse, error) {
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		return nil, fmt.Errorf("invalid start_time, use RFC3339 format")
	}
	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		return nil, fmt.Errorf("invalid end_time, use RFC3339 format")
	}

	if !endTime.After(startTime) {
		return nil, ErrInvalidTimeRange
	}

	// Determine client ID:
	// - If caller is a PRO and provided client_id, use it
	// - If caller is a PRO and no client_id, create an open slot (client_id = nil)
	// - If caller is a CLIENT, they are the client
	isPro := callerRole == "PROFESSIONAL"
	var clientID *string

	if isPro {
		if req.ClientID != "" {
			clientID = &req.ClientID
		}
		// else: open slot, clientID stays nil
	} else {
		clientID = &callerID
	}

	// Only enforce booking settings for client self-booking, not pro-created
	if !isPro {
		settings, err := s.settingsRepo.FindByUserID(req.ProfessionalID)
		if err == nil {
			if !settings.AllowClientSelfBooking {
				return nil, ErrSelfBookingDisabled
			}
			// startTime is fake-UTC (pro's wall clock); convert to the real
			// instant before comparing with time.Now().
			realStart := utils.WallToReal(startTime, utils.LocationOrKyiv(settings.Timezone))
			leadHours := time.Duration(settings.MinBookingLeadHours) * time.Hour
			if time.Until(realStart) < leadHours {
				return nil, ErrTooSoon
			}
			maxAdvance := time.Duration(settings.MaxBookingAdvanceDays) * 24 * time.Hour
			if time.Until(realStart) > maxAdvance {
				return nil, ErrTooFarAhead
			}
		}
	}

	// Pro-created appointments are auto-confirmed; client-created respect settings
	status := models.StatusConfirmed
	if !isPro {
		settings, _ := s.settingsRepo.FindByUserID(req.ProfessionalID)
		if settings != nil && settings.RequireBookingApproval {
			status = models.StatusPending
		}
	}

	var notes *string
	if req.ClientNotes != "" {
		notes = &req.ClientNotes
	}

	// Check if there is an existing open slot at this exact time to claim it
	var openAppt *models.Appointment
	if clientID != nil {
		existing, _ := s.appointmentRepo.FindByProfessionalAndDateRange(req.ProfessionalID, startTime, endTime)
		for _, e := range existing {
			if e.ClientID == nil && e.StartTime.Equal(startTime) && e.EndTime.Equal(endTime) {
				openAppt = &e
				break
			}
		}
	}

	if openAppt != nil {
		if err := s.appointmentRepo.ClaimOpenSlot(openAppt.ID, *clientID, status, notes); err != nil {
			return nil, err
		}
		updatedAppt, err := s.appointmentRepo.FindByID(openAppt.ID)
		if err != nil {
			return nil, err
		}
		s.activitySvc.Log(clientID, "appointment.created", "appointment", &openAppt.ID, nil, ip, ua)
		go s.notifyBooking(openAppt.ID, req.ProfessionalID, clientID, startTime, status == models.StatusConfirmed)
		return s.toResponse(updatedAppt)
	}

	appt := &models.Appointment{
		LocationID:     req.LocationID,
		ProfessionalID: req.ProfessionalID,
		ClientID:       clientID,
		StartTime:      startTime,
		EndTime:        endTime,
		Status:         status,
		ClientNotes:    notes,
	}

	if err := s.appointmentRepo.Create(appt); err != nil {
		return nil, err
	}

	s.activitySvc.Log(clientID, "appointment.created", "appointment", &appt.ID, nil, ip, ua)
	go s.notifyBooking(appt.ID, req.ProfessionalID, clientID, startTime, status == models.StatusConfirmed)

	return s.toResponse(appt)
}

func (s *AppointmentService) GetByID(id string) (*dto.AppointmentResponse, error) {
	appt, err := s.appointmentRepo.FindByID(id)
	if err == sql.ErrNoRows {
		return nil, ErrAppointmentNotFound
	}
	if err != nil {
		return nil, err
	}
	return s.toResponse(appt)
}

func (s *AppointmentService) ListByClient(clientID string, page, perPage int) (*dto.AppointmentListResponse, error) {
	if page < 1 { page = 1 }
	if perPage < 1 { perPage = 20 }
	if perPage > 500 { perPage = 500 }

	appts, total, err := s.appointmentRepo.FindByClientID(clientID, page, perPage)
	if err != nil {
		return nil, err
	}
	return s.toListResponse(appts, total, page, perPage)
}

func (s *AppointmentService) ListByProfessional(proID string, page, perPage int) (*dto.AppointmentListResponse, error) {
	if page < 1 { page = 1 }
	if perPage < 1 { perPage = 20 }
	if perPage > 500 { perPage = 500 }

	appts, total, err := s.appointmentRepo.FindByProfessionalID(proID, page, perPage)
	if err != nil {
		return nil, err
	}
	return s.toListResponse(appts, total, page, perPage)
}

func (s *AppointmentService) Reschedule(userID, appointmentID string, req dto.RescheduleRequest, ip, ua string) (*dto.AppointmentResponse, error) {
	appt, err := s.appointmentRepo.FindByID(appointmentID)
	if err == sql.ErrNoRows {
		return nil, ErrAppointmentNotFound
	}
	if err != nil {
		return nil, err
	}

	if appt.ProfessionalID != userID && (appt.ClientID == nil || *appt.ClientID != userID) {
		return nil, ErrNotAuthorized
	}

	newStart, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		return nil, fmt.Errorf("invalid start_time")
	}
	newEnd, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		return nil, fmt.Errorf("invalid end_time")
	}
	if !newEnd.After(newStart) {
		return nil, ErrInvalidTimeRange
	}

	// Check conflicts (exclude the current appointment)
	existing, _ := s.appointmentRepo.FindByProfessionalAndDateRange(appt.ProfessionalID, newStart, newEnd)
	for _, e := range existing {
		if e.ID != appointmentID {
			return nil, ErrTimeConflict
		}
	}

	if err := s.appointmentRepo.Reschedule(appointmentID, newStart, newEnd); err != nil {
		return nil, err
	}

	appt.StartTime = newStart
	appt.EndTime = newEnd

	s.activitySvc.Log(&userID, "appointment.rescheduled", "appointment", &appointmentID, nil, ip, ua)

	return s.toResponse(appt)
}

func (s *AppointmentService) UpdateStatus(userID, appointmentID, newStatus, ip, ua string) (*dto.AppointmentResponse, error) {
	appt, err := s.appointmentRepo.FindByID(appointmentID)
	if err == sql.ErrNoRows {
		return nil, ErrAppointmentNotFound
	}
	if err != nil {
		return nil, err
	}

	// Only pro or client can update
	if appt.ProfessionalID != userID && (appt.ClientID == nil || *appt.ClientID != userID) {
		return nil, ErrNotAuthorized
	}

	// Validate status transition
	validStatuses := map[string]bool{
		"Confirmed": true, "Cancelled": true, "Completed": true, "NoShow": true, "Pending": true,
	}
	if !validStatuses[newStatus] {
		return nil, ErrInvalidStatus
	}

	if err := s.appointmentRepo.UpdateStatus(appointmentID, models.AppointmentStatus(newStatus)); err != nil {
		return nil, err
	}

	appt.Status = models.AppointmentStatus(newStatus)

	action := "appointment.confirmed"
	switch newStatus {
	case "Cancelled":
		action = "appointment.cancelled"
		if s.notifySvc != nil {
			s.notifySvc.CancelForAppointment(appointmentID)
		}
	case "Completed":
		action = "appointment.completed"
	case "NoShow":
		action = "appointment.no_show"
	}
	s.activitySvc.Log(&userID, action, "appointment", &appointmentID, nil, ip, ua)

	return s.toResponse(appt)
}

func (s *AppointmentService) GetTodaySchedule(proID string, dateStr string) (*dto.TodayScheduleResponse, error) {
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		// Default to "today" on the pro's wall clock, not the server's UTC date.
		date = utils.WallNow(utils.LocationOrKyiv(""))
	}

	dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	dayEnd := dayStart.Add(24 * time.Hour)

	appts, _ := s.appointmentRepo.FindByProfessionalAndDateRange(proID, dayStart, dayEnd)
	schedBlocks, _ := s.scheduleRepo.FindBlocksByDateRange(proID, dayStart, dayEnd)

	total, pending, _ := s.appointmentRepo.CountTodayByProfessional(proID, dayStart, dayEnd)

	var items []dto.TodayScheduleItem

	// Add appointments
	for _, a := range appts {
		dur := a.EndTime.Sub(a.StartTime)
		durStr := fmt.Sprintf("%dm", int(dur.Minutes()))
		if dur.Hours() >= 1 {
			durStr = fmt.Sprintf("%dh", int(dur.Hours()))
			if int(dur.Minutes())%60 > 0 {
				durStr = fmt.Sprintf("%dh%dm", int(dur.Hours()), int(dur.Minutes())%60)
			}
		}

		var clientName *string
		var clientPhone *string
		if a.ClientID != nil {
			client, _ := s.userRepo.FindByID(*a.ClientID)
			if client != nil {
				clientName = &client.FullName
				ph, err := s.phoneRepo.FindPrimaryByUserID(client.ID)
				if err == nil {
					clientPhone = &ph.PhoneNumber
				}
			}
		} else {
			open := "Open Slot"
			clientName = &open
		}

		items = append(items, dto.TodayScheduleItem{
			ID:          a.ID,
			Hour:        a.StartTime.Format("15:04"),
			Client:      clientName,
			ClientPhone: clientPhone,
			Service:     "Appointment",
			Status:      string(a.Status),
			Duration:    durStr,
			Notes:       a.ClientNotes,
			IsBlock:     false,
		})
	}

	// Add schedule blocks
	for _, b := range schedBlocks {
		dur := b.EndTime.Sub(b.StartTime)
		durStr := fmt.Sprintf("%dm", int(dur.Minutes()))
		if dur.Hours() >= 1 {
			durStr = fmt.Sprintf("%dh", int(dur.Hours()))
		}
		blockName := "Blocked"
		if b.BlockReason != nil {
			blockName = *b.BlockReason
		}

		items = append(items, dto.TodayScheduleItem{
			ID:          b.ID,
			Hour:        b.StartTime.Format("15:04"),
			Client:      &blockName,
			Service:     "Block",
			Status:      "Block",
			Duration:    durStr,
			IsBlock:     true,
			BlockReason: b.BlockReason,
		})
	}

	if items == nil {
		items = []dto.TodayScheduleItem{}
	}

	return &dto.TodayScheduleResponse{
		Date:         date.Format("2006-01-02"),
		Items:        items,
		TotalToday:   total,
		PendingCount: pending,
	}, nil
}

func (s *AppointmentService) toResponse(appt *models.Appointment) (*dto.AppointmentResponse, error) {
	pro, _ := s.userRepo.FindByID(appt.ProfessionalID)

	proMini := dto.MiniPro{ID: appt.ProfessionalID}
	if pro != nil {
		proMini.FullName = pro.FullName
	}

	var clientMini dto.MiniClient
	if appt.ClientID != nil {
		clientMini.ID = *appt.ClientID
		client, _ := s.userRepo.FindByID(*appt.ClientID)
		if client != nil {
			clientMini.FullName = client.FullName
			ph, err := s.phoneRepo.FindPrimaryByUserID(client.ID)
			if err == nil {
				clientMini.Phone = &ph.PhoneNumber
			}
		}
	} else {
		clientMini.FullName = "Open Slot"
	}

	// Get location name
	locationName := ""
	// We could inject locationRepo but keep it simple — location_id is returned for frontend to resolve
	_ = locationName

	return &dto.AppointmentResponse{
		ID:           appt.ID,
		LocationID:   appt.LocationID,
		LocationName: "",
		Professional: proMini,
		Client:       clientMini,
		StartTime:    appt.StartTime.Format(time.RFC3339),
		EndTime:      appt.EndTime.Format(time.RFC3339),
		Status:       string(appt.Status),
		ClientNotes:  appt.ClientNotes,
		CreatedAt:    appt.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (s *AppointmentService) toListResponse(appts []models.Appointment, total, page, perPage int) (*dto.AppointmentListResponse, error) {
	var items []dto.AppointmentResponse
	for i := range appts {
		resp, err := s.toResponse(&appts[i])
		if err != nil {
			continue
		}
		items = append(items, *resp)
	}
	if items == nil {
		items = []dto.AppointmentResponse{}
	}
	return &dto.AppointmentListResponse{
		Appointments: items,
		Total:        total,
		Page:         page,
		PerPage:      perPage,
	}, nil
}
