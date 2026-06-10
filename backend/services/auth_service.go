package services

import (
	"database/sql"
	"errors"
	"time"

	"gymapp-backend/config"
	"gymapp-backend/dto"
	"gymapp-backend/models"
	"gymapp-backend/repositories"
	"gymapp-backend/utils"
)

var (
	ErrEmailTaken   = errors.New("email already registered")
	ErrPhoneTaken   = errors.New("phone number already registered")
	ErrInvalidCreds = errors.New("invalid credentials")
	ErrInvalidToken = errors.New("invalid or expired refresh token")
)

type AuthService struct {
	cfg         *config.Config
	userRepo    *repositories.UserRepo
	phoneRepo   *repositories.PhoneRepo
	sessionRepo *repositories.SessionRepo
	activitySvc *ActivityService
}

func NewAuthService(cfg *config.Config, userRepo *repositories.UserRepo, phoneRepo *repositories.PhoneRepo, sessionRepo *repositories.SessionRepo, activitySvc *ActivityService) *AuthService {
	return &AuthService{
		cfg:         cfg,
		userRepo:    userRepo,
		phoneRepo:   phoneRepo,
		sessionRepo: sessionRepo,
		activitySvc: activitySvc,
	}
}

func (s *AuthService) Register(req dto.RegisterRequest, userAgent, ip string) (*dto.AuthResponse, error) {
	req.Phone = utils.NormalizePhoneNumber(req.Phone)
	// Check email uniqueness
	if req.Email != "" {
		taken, err := s.userRepo.EmailExists(req.Email)
		if err != nil {
			return nil, err
		}
		if taken {
			return nil, ErrEmailTaken
		}
	}

	// Check phone uniqueness
	taken, err := s.phoneRepo.PhoneExists(req.Phone)
	if err != nil {
		return nil, err
	}
	if taken {
		return nil, ErrPhoneTaken
	}

	// Hash password
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Create user
	var email *string
	if req.Email != "" {
		email = &req.Email
	}

	user := &models.User{
		Role:         req.Role,
		FullName:     req.FullName,
		PasswordHash: hash,
		Email:        email,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Create phone record
	phone := &models.UserPhone{
		UserID:      user.ID,
		PhoneNumber: req.Phone,
		IsPrimary:   true,
	}
	if err := s.phoneRepo.Create(phone); err != nil {
		return nil, err
	}

	// Log activity
	s.activitySvc.Log(&user.ID, "user.registered", "user", &user.ID, nil, ip, userAgent)

	// Issue tokens
	return s.issueTokens(user, &req.Phone, userAgent, ip)
}

func (s *AuthService) Login(req dto.LoginRequest, userAgent, ip string) (*dto.AuthResponse, error) {
	req.Phone = utils.NormalizePhoneNumber(req.Phone)
	user, err := s.userRepo.FindByPhone(req.Phone)

	if err == sql.ErrNoRows {
		return nil, ErrInvalidCreds
	}
	if err != nil {
		return nil, err
	}

	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		return nil, ErrInvalidCreds
	}

	// Log activity
	s.activitySvc.Log(&user.ID, "user.login", "user", &user.ID, nil, ip, userAgent)

	// Get primary phone for response
	var phoneStr *string
	ph, err := s.phoneRepo.FindPrimaryByUserID(user.ID)
	if err == nil {
		phoneStr = &ph.PhoneNumber
	}

	return s.issueTokens(user, phoneStr, userAgent, ip)
}

func (s *AuthService) Refresh(refreshToken, userAgent, ip string) (*dto.AuthResponse, error) {
	session, err := s.sessionRepo.FindByRefreshToken(refreshToken)
	if err == sql.ErrNoRows {
		return nil, ErrInvalidToken
	}
	if err != nil {
		return nil, err
	}

	if time.Now().After(session.ExpiresAt) {
		_ = s.sessionRepo.DeleteByRefreshToken(refreshToken)
		return nil, ErrInvalidToken
	}

	// Delete old session (rotate token)
	_ = s.sessionRepo.DeleteByRefreshToken(refreshToken)

	user, err := s.userRepo.FindByID(session.UserID)
	if err != nil {
		return nil, err
	}

	var phoneStr *string
	ph, err := s.phoneRepo.FindPrimaryByUserID(user.ID)
	if err == nil {
		phoneStr = &ph.PhoneNumber
	}

	return s.issueTokens(user, phoneStr, userAgent, ip)
}

func (s *AuthService) Logout(refreshToken string) error {
	return s.sessionRepo.DeleteByRefreshToken(refreshToken)
}

func (s *AuthService) issueTokens(user *models.User, phone *string, userAgent, ip string) (*dto.AuthResponse, error) {
	accessToken, err := utils.GenerateAccessToken(s.cfg.JWTSecret, user.ID, string(user.Role), s.cfg.AccessTokenTTL)
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	session := &models.Session{
		UserID:       user.ID,
		RefreshToken: refreshToken,
		UserAgent:    userAgent,
		IPAddress:    ip,
		ExpiresAt:    time.Now().Add(time.Duration(s.cfg.RefreshTokenTTL) * time.Minute),
	}
	if err := s.sessionRepo.Create(session); err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: dto.UserResponse{
			ID:             user.ID,
			Role:           string(user.Role),
			FullName:       user.FullName,
			Email:          user.Email,
			Phone:          phone,
			IsSelfEmployed: user.IsSelfEmployed,
		},
	}, nil
}
