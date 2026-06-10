package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"gymapp-backend/models"
)

func ProfessionalOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("user_role")
		if !exists || role != string(models.RoleProfessional) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Professional access required"})
			return
		}
		c.Next()
	}
}
