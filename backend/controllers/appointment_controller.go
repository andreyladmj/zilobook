package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"gymapp-backend/dto"
	"gymapp-backend/services"
	"gymapp-backend/utils"
)

type AppointmentController struct {
	appointmentSvc *services.AppointmentService
	scheduleSvc    *services.ScheduleService
}

func NewAppointmentController(appointmentSvc *services.AppointmentService, scheduleSvc *services.ScheduleService) *AppointmentController {
	return &AppointmentController{
		appointmentSvc: appointmentSvc,
		scheduleSvc:    scheduleSvc,
	}
}

// GET /api/availability?professional_id=&location_id=&date=
func (ac *AppointmentController) GetAvailability(c *gin.Context) {
	proID := c.Query("professional_id")
	locID := c.Query("location_id")
	date := c.Query("date")

	if proID == "" || locID == "" || date == "" {
		utils.Error(c, http.StatusBadRequest, "professional_id, location_id, and date are required")
		return
	}

	result, err := ac.scheduleSvc.GetAvailability(proID, locID, date)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, result)
}

// POST /api/appointments
func (ac *AppointmentController) Create(c *gin.Context) {
	var req dto.CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	result, err := ac.appointmentSvc.Create(userID.(string), userRole.(string), req, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrTimeConflict):
			utils.Error(c, http.StatusConflict, "This time slot is already booked")
		case errors.Is(err, services.ErrTooSoon):
			utils.Error(c, http.StatusBadRequest, "Booking too close to start time")
		case errors.Is(err, services.ErrTooFarAhead):
			utils.Error(c, http.StatusBadRequest, "Booking too far in advance")
		case errors.Is(err, services.ErrSelfBookingDisabled):
			utils.Error(c, http.StatusForbidden, "This professional doesn't accept self-booking")
		case errors.Is(err, services.ErrInvalidTimeRange):
			utils.Error(c, http.StatusBadRequest, "End time must be after start time")
		default:
			utils.Error(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.Success(c, http.StatusCreated, result)
}

// GET /api/appointments
func (ac *AppointmentController) ListMine(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("user_role")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	var result *dto.AppointmentListResponse
	var err error

	if role.(string) == "PROFESSIONAL" {
		result, err = ac.appointmentSvc.ListByProfessional(userID.(string), page, perPage)
	} else {
		result, err = ac.appointmentSvc.ListByClient(userID.(string), page, perPage)
	}

	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to fetch appointments")
		return
	}

	utils.Success(c, http.StatusOK, result)
}

// PUT /api/appointments/:id/reschedule
func (ac *AppointmentController) Reschedule(c *gin.Context) {
	var req dto.RescheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := c.Get("user_id")
	appointmentID := c.Param("id")

	result, err := ac.appointmentSvc.Reschedule(userID.(string), appointmentID, req, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrAppointmentNotFound):
			utils.Error(c, http.StatusNotFound, "Appointment not found")
		case errors.Is(err, services.ErrNotAuthorized):
			utils.Error(c, http.StatusForbidden, "Not authorized")
		case errors.Is(err, services.ErrTimeConflict):
			utils.Error(c, http.StatusConflict, "Цей час уже зайнято")
		case errors.Is(err, services.ErrInvalidTimeRange):
			utils.Error(c, http.StatusBadRequest, "End time must be after start time")
		case errors.Is(err, services.ErrCancellationWindow):
			utils.Error(c, http.StatusBadRequest, "Час для перенесення вже минув")
		case errors.Is(err, services.ErrTooSoon):
			utils.Error(c, http.StatusBadRequest, "Новий час занадто близько — оберіть пізніший слот")
		default:
			utils.Error(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.Success(c, http.StatusOK, result)
}

// GET /api/appointments/:id
func (ac *AppointmentController) GetByID(c *gin.Context) {
	id := c.Param("id")

	result, err := ac.appointmentSvc.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrAppointmentNotFound) {
			utils.Error(c, http.StatusNotFound, "Appointment not found")
		} else {
			utils.Error(c, http.StatusInternalServerError, "Failed to fetch appointment")
		}
		return
	}

	utils.Success(c, http.StatusOK, result)
}

// PUT /api/appointments/:id/status
func (ac *AppointmentController) UpdateStatus(c *gin.Context) {
	var req dto.UpdateAppointmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := c.Get("user_id")
	appointmentID := c.Param("id")

	result, err := ac.appointmentSvc.UpdateStatus(userID.(string), appointmentID, req.Status, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrAppointmentNotFound):
			utils.Error(c, http.StatusNotFound, "Appointment not found")
		case errors.Is(err, services.ErrNotAuthorized):
			utils.Error(c, http.StatusForbidden, "Not authorized")
		case errors.Is(err, services.ErrInvalidStatus):
			utils.Error(c, http.StatusBadRequest, "Invalid status")
		case errors.Is(err, services.ErrClientStatusChange):
			utils.Error(c, http.StatusForbidden, "Ви можете лише скасувати запис")
		case errors.Is(err, services.ErrCancellationWindow):
			utils.Error(c, http.StatusBadRequest, "Час для скасування вже минув")
		default:
			utils.Error(c, http.StatusInternalServerError, "Failed to update status")
		}
		return
	}

	utils.Success(c, http.StatusOK, result)
}

// GET /api/dashboard/today
func (ac *AppointmentController) GetToday(c *gin.Context) {
	userID, _ := c.Get("user_id")
	date := c.DefaultQuery("date", "")

	result, err := ac.appointmentSvc.GetTodaySchedule(userID.(string), date)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to fetch schedule")
		return
	}

	utils.Success(c, http.StatusOK, result)
}

// POST /api/schedule/working-hours
func (ac *AppointmentController) CreateWorkingHours(c *gin.Context) {
	var req dto.CreateWorkingHoursRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := c.Get("user_id")

	result, err := ac.scheduleSvc.CreateWorkingHours(userID.(string), req, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, result)
}

// POST /api/schedule/blocks
func (ac *AppointmentController) CreateBlock(c *gin.Context) {
	var req dto.CreateBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := c.Get("user_id")

	result, err := ac.scheduleSvc.CreateBlock(userID.(string), req, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, result)
}

// DELETE /api/schedule/blocks/:id
func (ac *AppointmentController) DeleteBlock(c *gin.Context) {
	userID, _ := c.Get("user_id")
	blockID := c.Param("id")

	err := ac.scheduleSvc.DeleteBlock(userID.(string), blockID, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrBlockNotFound):
			utils.Error(c, http.StatusNotFound, "Block not found")
		case errors.Is(err, services.ErrNotBlockOwner):
			utils.Error(c, http.StatusForbidden, "Not authorized")
		default:
			utils.Error(c, http.StatusInternalServerError, "Failed to delete block")
		}
		return
	}

	utils.Success(c, http.StatusOK, gin.H{"message": "Block deleted"})
}

func (ac *AppointmentController) GetWorkingHours(c *gin.Context) {
	userID, _ := c.Get("user_id")

	result, err := ac.scheduleSvc.GetWorkingHours(userID.(string))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to fetch working hours")
		return
	}

	utils.Success(c, http.StatusOK, result)
}

func (ac *AppointmentController) UpdateWorkingHours(c *gin.Context) {
	var req []dto.CreateWorkingHoursRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := c.Get("user_id")

	result, err := ac.scheduleSvc.UpdateWorkingHours(userID.(string), req, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, result)
}
