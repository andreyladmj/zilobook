package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"gymapp-backend/services"
	"gymapp-backend/utils"
)

type NotificationController struct {
	notifySvc *services.NotificationService
}

func NewNotificationController(notifySvc *services.NotificationService) *NotificationController {
	return &NotificationController{notifySvc: notifySvc}
}

// GetTelegramLink returns a one-time deep link to connect the user's Telegram,
// plus whether they're already linked. Frontend shows a "Connect Telegram" button.
func (nc *NotificationController) GetTelegramLink(c *gin.Context) {
	if !nc.notifySvc.Enabled() {
		utils.Error(c, http.StatusServiceUnavailable, "Telegram notifications are not configured")
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(string)

	if nc.notifySvc.IsLinked(uid) {
		utils.Success(c, http.StatusOK, gin.H{"linked": true})
		return
	}

	deepLink, err := nc.notifySvc.GenerateLinkCode(uid)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to create link")
		return
	}

	utils.Success(c, http.StatusOK, gin.H{"linked": false, "deep_link": deepLink})
}
