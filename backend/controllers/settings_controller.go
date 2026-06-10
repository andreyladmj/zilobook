package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"gymapp-backend/dto"
	"gymapp-backend/services"
	"gymapp-backend/utils"
)

type SettingsController struct {
	settingsService *services.SettingsService
}

func NewSettingsController(settingsService *services.SettingsService) *SettingsController {
	return &SettingsController{settingsService: settingsService}
}

func (sc *SettingsController) Get(c *gin.Context) {
	userID, _ := c.Get("user_id")

	result, err := sc.settingsService.GetOrCreate(userID.(string))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to fetch settings")
		return
	}

	utils.Success(c, http.StatusOK, result)
}

func (sc *SettingsController) Update(c *gin.Context) {
	var req dto.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := c.Get("user_id")

	result, err := sc.settingsService.Update(userID.(string), req)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to update settings")
		return
	}

	utils.Success(c, http.StatusOK, result)
}
