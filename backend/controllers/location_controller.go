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

type LocationController struct {
	locationService *services.LocationService
}

func NewLocationController(locationService *services.LocationService) *LocationController {
	return &LocationController{locationService: locationService}
}

func (lc *LocationController) List(c *gin.Context) {
	locType := c.Query("type")
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	result, err := lc.locationService.List(locType, search, page, perPage)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to fetch locations")
		return
	}

	utils.Success(c, http.StatusOK, result)
}

func (lc *LocationController) GetByID(c *gin.Context) {
	id := c.Param("id")

	result, err := lc.locationService.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrLocationNotFound) {
			utils.Error(c, http.StatusNotFound, "Location not found")
		} else {
			utils.Error(c, http.StatusInternalServerError, "Failed to fetch location")
		}
		return
	}

	utils.Success(c, http.StatusOK, result)
}

func (lc *LocationController) Create(c *gin.Context) {
	var req dto.CreateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := c.Get("user_id")

	result, err := lc.locationService.Create(userID.(string), req, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to create location")
		return
	}

	utils.Success(c, http.StatusCreated, result)
}

func (lc *LocationController) Update(c *gin.Context) {
	var req dto.UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := c.Get("user_id")
	locationID := c.Param("id")

	result, err := lc.locationService.Update(userID.(string), locationID, req, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrLocationNotFound):
			utils.Error(c, http.StatusNotFound, "Location not found")
		case errors.Is(err, services.ErrNotLocationOwner):
			utils.Error(c, http.StatusForbidden, "You don't own this location")
		default:
			utils.Error(c, http.StatusInternalServerError, "Failed to update location")
		}
		return
	}

	utils.Success(c, http.StatusOK, result)
}

func (lc *LocationController) Delete(c *gin.Context) {
	userID, _ := c.Get("user_id")
	locationID := c.Param("id")

	err := lc.locationService.Delete(userID.(string), locationID, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrLocationNotFound):
			utils.Error(c, http.StatusNotFound, "Location not found")
		case errors.Is(err, services.ErrNotLocationOwner):
			utils.Error(c, http.StatusForbidden, "You don't own this location")
		default:
			utils.Error(c, http.StatusInternalServerError, "Failed to delete location")
		}
		return
	}

	utils.Success(c, http.StatusOK, gin.H{"message": "Location deleted"})
}

func (lc *LocationController) ListByOwner(c *gin.Context) {
	userID, _ := c.Get("user_id")

	result, err := lc.locationService.ListByOwner(userID.(string))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to fetch locations")
		return
	}

	utils.Success(c, http.StatusOK, gin.H{"locations": result})
}
