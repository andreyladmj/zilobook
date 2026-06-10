package services

import (
	"encoding/json"
	"log"

	"gymapp-backend/models"
	"gymapp-backend/repositories"
)

type ActivityService struct {
	activityRepo *repositories.ActivityRepo
}

func NewActivityService(activityRepo *repositories.ActivityRepo) *ActivityService {
	return &ActivityService{activityRepo: activityRepo}
}

func (s *ActivityService) Log(userID *string, action, entityType string, entityID *string, metadata map[string]interface{}, ip, ua string) {
	var metaJSON *string
	if metadata != nil {
		b, err := json.Marshal(metadata)
		if err == nil {
			str := string(b)
			metaJSON = &str
		}
	}

	var et *string
	if entityType != "" {
		et = &entityType
	}

	var ipPtr, uaPtr *string
	if ip != "" {
		ipPtr = &ip
	}
	if ua != "" {
		uaPtr = &ua
	}

	entry := &models.ActivityLog{
		UserID:     userID,
		Action:     action,
		EntityType: et,
		EntityID:   entityID,
		Metadata:   metaJSON,
		IPAddress:  ipPtr,
		UserAgent:  uaPtr,
	}

	if err := s.activityRepo.Create(entry); err != nil {
		log.Printf("Activity log failed: %v", err)
	}
}
