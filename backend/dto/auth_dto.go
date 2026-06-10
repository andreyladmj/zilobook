package dto

import "gymapp-backend/models"

// --- Requests ---

type RegisterRequest struct {
	FullName string          `json:"full_name" binding:"required,min=2"`
	Role     models.UserRole `json:"role" binding:"required"`
	Phone    string          `json:"phone" binding:"required"`
	Email    string          `json:"email"`
	Password string          `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// --- Responses ---

type AuthResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

type UserResponse struct {
	ID             string  `json:"id"`
	Role           string  `json:"role"`
	FullName       string  `json:"full_name"`
	Email          *string `json:"email"`
	Phone          *string `json:"phone"`
	IsSelfEmployed bool    `json:"is_self_employed"`
}
