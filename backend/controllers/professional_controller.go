package controllers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"gymapp-backend/dto"
	"gymapp-backend/models"
	"gymapp-backend/repositories"
	"gymapp-backend/utils"
)

type ProfessionalController struct {
	locationRepo *repositories.LocationRepo
	userRepo     *repositories.UserRepo
}

func NewProfessionalController(locationRepo *repositories.LocationRepo, userRepo *repositories.UserRepo) *ProfessionalController {
	return &ProfessionalController{
		locationRepo: locationRepo,
		userRepo:     userRepo,
	}
}

func (pc *ProfessionalController) ListByLocation(c *gin.Context) {
	locationID := c.Query("location_id")
	if locationID == "" {
		utils.Error(c, http.StatusBadRequest, "location_id query param required")
		return
	}

	pros, err := pc.locationRepo.FindProfessionalsByLocationID(locationID)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to fetch professionals")
		return
	}
	if pros == nil {
		pros = []dto.ProfessionalResponse{}
	}

	utils.Success(c, http.StatusOK, gin.H{"professionals": pros})
}

func (pc *ProfessionalController) ListMyStaff(c *gin.Context) {
	userID := c.GetString("user_id")
	query := c.Query("q")
	page := 1
	perPage := 40
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if pp := c.Query("per_page"); pp != "" {
		if v, err := strconv.Atoi(pp); err == nil && v > 0 && v <= 100 {
			perPage = v
		}
	}
	offset := (page - 1) * perPage

	pros, total, err := pc.locationRepo.FindProfessionalsByOwnerLocations(userID, query, perPage, offset)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to fetch staff")
		return
	}
	if pros == nil {
		pros = []dto.ProfessionalResponse{}
	}

	// Enrich with phone numbers
	result := make([]gin.H, 0, len(pros))
	for _, p := range pros {
		phone, _ := pc.userRepo.FindPhoneByUserID(p.ID)
		result = append(result, gin.H{
			"id":                p.ID,
			"full_name":         p.FullName,
			"profile_image_url": p.ProfileImageURL,
			"bio":               p.Bio,
			"role_description":  p.RoleDescription,
			"phone":             phone,
		})
	}

	utils.Success(c, http.StatusOK, gin.H{
		"professionals": result,
		"total":         total,
		"page":          page,
		"per_page":      perPage,
	})
}

func (pc *ProfessionalController) Search(c *gin.Context) {
	query := c.Query("q")
	page := 1
	perPage := 20
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if pp := c.Query("per_page"); pp != "" {
		if v, err := strconv.Atoi(pp); err == nil && v > 0 && v <= 100 {
			perPage = v
		}
	}
	offset := (page - 1) * perPage

	var users []models.User
	var total int
	var err error

	if query == "" {
		users, total, err = pc.userRepo.ListProfessionals(perPage, offset)
	} else {
		users, total, err = pc.userRepo.SearchProfessionals(query, perPage, offset)
	}
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to search professionals")
		return
	}

	pros := make([]gin.H, 0, len(users))
	for _, u := range users {
		phone, _ := pc.userRepo.FindPhoneByUserID(u.ID)
		pros = append(pros, gin.H{
			"id":                u.ID,
			"full_name":         u.FullName,
			"profile_image_url": u.ProfileImageURL,
			"bio":               u.Bio,
			"email":             u.Email,
			"phone":             phone,
		})
	}

	utils.Success(c, http.StatusOK, gin.H{
		"professionals": pros,
		"total":         total,
		"page":          page,
		"per_page":      perPage,
	})
}

func (pc *ProfessionalController) LinkToLocation(c *gin.Context) {
	userID := c.GetString("user_id")
	var req struct {
		ProfessionalID string   `json:"professional_id" binding:"required"`
		LocationIDs    []string `json:"location_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "professional_id and location_ids required")
		return
	}

	// Verify each location is owned by the current user
	for _, locID := range req.LocationIDs {
		loc, err := pc.locationRepo.FindByID(locID)
		if err != nil {
			utils.Error(c, http.StatusBadRequest, "Location not found: "+locID)
			return
		}
		if loc.OwnerID == nil || *loc.OwnerID != userID {
			utils.Error(c, http.StatusForbidden, "You don't own location: "+loc.Name)
			return
		}
	}

	linked := 0
	for _, locID := range req.LocationIDs {
		if err := pc.locationRepo.LinkProfessionalToLocation(req.ProfessionalID, locID); err == nil {
			linked++
		}
	}

	utils.Success(c, http.StatusOK, gin.H{"linked": linked})
}

func (pc *ProfessionalController) UnlinkFromLocation(c *gin.Context) {
	userID := c.GetString("user_id")
	var req struct {
		ProfessionalID string `json:"professional_id" binding:"required"`
		LocationID     string `json:"location_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "professional_id and location_id required")
		return
	}

	loc, err := pc.locationRepo.FindByID(req.LocationID)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "Location not found")
		return
	}
	if loc.OwnerID == nil || *loc.OwnerID != userID {
		utils.Error(c, http.StatusForbidden, "You don't own this location")
		return
	}

	if err := pc.locationRepo.UnlinkProfessionalFromLocation(req.ProfessionalID, req.LocationID); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to unlink")
		return
	}

	utils.Success(c, http.StatusOK, gin.H{"unlinked": true})
}

func (pc *ProfessionalController) GetByID(c *gin.Context) {
	id := c.Param("id")

	user, err := pc.userRepo.FindByID(id)
	if err == sql.ErrNoRows {
		utils.Error(c, http.StatusNotFound, "Professional not found")
		return
	}
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Failed to fetch professional")
		return
	}

	if string(user.Role) != "PROFESSIONAL" {
		utils.Error(c, http.StatusNotFound, "Professional not found")
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"id":                user.ID,
		"full_name":         user.FullName,
		"profile_image_url": user.ProfileImageURL,
		"bio":               user.Bio,
		"role":              user.Role,
	})
}
