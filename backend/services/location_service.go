package services

import (
	"database/sql"
	"errors"

	"gymapp-backend/dto"
	"gymapp-backend/models"
	"gymapp-backend/repositories"
)

var (
	ErrLocationNotFound = errors.New("location not found")
	ErrNotLocationOwner = errors.New("not location owner")
)

type LocationService struct {
	locationRepo *repositories.LocationRepo
	activitySvc  *ActivityService
}

func NewLocationService(locationRepo *repositories.LocationRepo, activitySvc *ActivityService) *LocationService {
	return &LocationService{
		locationRepo: locationRepo,
		activitySvc:  activitySvc,
	}
}

func (s *LocationService) Create(userID string, req dto.CreateLocationRequest, ip, ua string) (*dto.LocationResponse, error) {
	var desc *string
	if req.Description != "" {
		desc = &req.Description
	}

	loc := &models.Location{
		OwnerID:     &userID,
		Name:        req.Name,
		Type:        req.Type,
		Address:     req.Address,
		Description: desc,
	}

	if err := s.locationRepo.Create(loc); err != nil {
		return nil, err
	}

	s.activitySvc.Log(&userID, "location.created", "location", &loc.ID, nil, ip, ua)

	return s.toResponse(loc, nil, nil), nil
}

func (s *LocationService) GetByID(id string) (*dto.LocationResponse, error) {
	loc, err := s.locationRepo.FindByID(id)
	if err == sql.ErrNoRows {
		return nil, ErrLocationNotFound
	}
	if err != nil {
		return nil, err
	}

	images, _ := s.locationRepo.FindImagesByLocationID(id)
	pros, _ := s.locationRepo.FindProfessionalsByLocationID(id)

	return s.toResponse(loc, images, pros), nil
}

func (s *LocationService) GetBySlug(slug string) (*dto.LocationResponse, error) {
	loc, err := s.locationRepo.FindBySlug(slug)
	if err == sql.ErrNoRows {
		return nil, ErrLocationNotFound
	}
	if err != nil {
		return nil, err
	}

	images, _ := s.locationRepo.FindImagesByLocationID(loc.ID)
	pros, _ := s.locationRepo.FindProfessionalsByLocationID(loc.ID)

	return s.toResponse(loc, images, pros), nil
}

func (s *LocationService) List(locationType, search string, page, perPage int) (*dto.LocationListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 50 {
		perPage = 20
	}

	locations, total, err := s.locationRepo.FindAll(locationType, search, page, perPage)
	if err != nil {
		return nil, err
	}

	var items []dto.LocationResponse
	for i := range locations {
		images, _ := s.locationRepo.FindImagesByLocationID(locations[i].ID)
		items = append(items, *s.toResponse(&locations[i], images, nil))
	}

	return &dto.LocationListResponse{
		Locations: items,
		Total:     total,
		Page:      page,
		PerPage:   perPage,
	}, nil
}

func (s *LocationService) ListByOwner(ownerID string) ([]dto.LocationResponse, error) {
	locations, err := s.locationRepo.FindByOwnerID(ownerID)
	if err != nil {
		return nil, err
	}

	var items []dto.LocationResponse
	for i := range locations {
		images, _ := s.locationRepo.FindImagesByLocationID(locations[i].ID)
		items = append(items, *s.toResponse(&locations[i], images, nil))
	}
	return items, nil
}

func (s *LocationService) Update(userID, locationID string, req dto.UpdateLocationRequest, ip, ua string) (*dto.LocationResponse, error) {
	loc, err := s.locationRepo.FindByID(locationID)
	if err == sql.ErrNoRows {
		return nil, ErrLocationNotFound
	}
	if err != nil {
		return nil, err
	}

	if loc.OwnerID == nil || *loc.OwnerID != userID {
		return nil, ErrNotLocationOwner
	}

	if req.Name != nil {
		loc.Name = *req.Name
	}
	if req.Type != nil {
		loc.Type = *req.Type
	}
	if req.Address != nil {
		loc.Address = *req.Address
	}
	if req.Description != nil {
		loc.Description = req.Description
	}

	if err := s.locationRepo.Update(loc); err != nil {
		return nil, err
	}

	s.activitySvc.Log(&userID, "location.updated", "location", &loc.ID, nil, ip, ua)

	images, _ := s.locationRepo.FindImagesByLocationID(locationID)
	pros, _ := s.locationRepo.FindProfessionalsByLocationID(locationID)

	return s.toResponse(loc, images, pros), nil
}

func (s *LocationService) Delete(userID, locationID string, ip, ua string) error {
	loc, err := s.locationRepo.FindByID(locationID)
	if err == sql.ErrNoRows {
		return ErrLocationNotFound
	}
	if err != nil {
		return err
	}

	if loc.OwnerID == nil || *loc.OwnerID != userID {
		return ErrNotLocationOwner
	}

	if err := s.locationRepo.Delete(locationID); err != nil {
		return err
	}

	s.activitySvc.Log(&userID, "location.deleted", "location", &locationID, nil, ip, ua)
	return nil
}

func (s *LocationService) FindProfessionalsByLocationID(locationID string) ([]dto.ProfessionalResponse, error) {
	return s.locationRepo.FindProfessionalsByLocationID(locationID)
}

func (s *LocationService) toResponse(loc *models.Location, images []models.LocationImage, pros []dto.ProfessionalResponse) *dto.LocationResponse {
	var imgResp []dto.LocationImageResponse
	for _, img := range images {
		imgResp = append(imgResp, dto.LocationImageResponse{
			ID:           img.ID,
			ImageURL:     img.ImageURL,
			DisplayOrder: img.DisplayOrder,
		})
	}
	if imgResp == nil {
		imgResp = []dto.LocationImageResponse{}
	}

	resp := &dto.LocationResponse{
		ID:            loc.ID,
		OwnerID:       loc.OwnerID,
		Name:          loc.Name,
		TitleSlug:     loc.TitleSlug,
		Type:          loc.Type,
		Address:       loc.Address,
		Description:   loc.Description,
		Images:        imgResp,
		Professionals: pros,
		CreatedAt:     loc.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
	return resp
}
