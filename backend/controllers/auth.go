package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"gymapp-backend/dto"
	"gymapp-backend/services"
	"gymapp-backend/utils"
)

type AuthController struct {
	authService *services.AuthService
}

func NewAuthController(authService *services.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

func (ac *AuthController) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := ac.authService.Register(req, c.GetHeader("User-Agent"), c.ClientIP())
	if err != nil {
		switch {
		case errors.Is(err, services.ErrEmailTaken):
			utils.Error(c, http.StatusConflict, "Email already registered")
		case errors.Is(err, services.ErrPhoneTaken):
			utils.Error(c, http.StatusConflict, "Phone number already registered")
		default:
			utils.Error(c, http.StatusInternalServerError, "Registration failed")
		}
		return
	}

	utils.Success(c, http.StatusCreated, result)
}

func (ac *AuthController) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := ac.authService.Login(req, c.GetHeader("User-Agent"), c.ClientIP())
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidCreds):
			utils.Error(c, http.StatusUnauthorized, "Invalid credentials")
		default:
			utils.Error(c, http.StatusInternalServerError, "Login failed")
		}
		return
	}

	utils.Success(c, http.StatusOK, result)
}

func (ac *AuthController) Refresh(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := ac.authService.Refresh(req.RefreshToken, c.GetHeader("User-Agent"), c.ClientIP())
	if err != nil {
		if errors.Is(err, services.ErrInvalidToken) {
			utils.Error(c, http.StatusUnauthorized, "Invalid or expired refresh token")
		} else {
			utils.Error(c, http.StatusInternalServerError, "Token refresh failed")
		}
		return
	}

	utils.Success(c, http.StatusOK, result)
}

func (ac *AuthController) Logout(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	_ = ac.authService.Logout(req.RefreshToken)
	utils.Success(c, http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func (ac *AuthController) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("user_role")
	utils.Success(c, http.StatusOK, gin.H{
		"user_id": userID,
		"role":    role,
	})
}
