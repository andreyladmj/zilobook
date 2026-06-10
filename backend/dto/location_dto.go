package dto

type CreateLocationRequest struct {
	Name        string `json:"name" binding:"required,min=2"`
	Type        string `json:"type" binding:"required"`
	Address     string `json:"address" binding:"required"`
	Description string `json:"description"`
}

type UpdateLocationRequest struct {
	Name        *string `json:"name"`
	Type        *string `json:"type"`
	Address     *string `json:"address"`
	Description *string `json:"description"`
}

type LocationResponse struct {
	ID            string                  `json:"id"`
	OwnerID       *string                 `json:"owner_id,omitempty"`
	Name          string                  `json:"name"`
	TitleSlug     string                  `json:"title_slug"`
	Type          string                  `json:"type"`
	Address       string                  `json:"address"`
	Description   *string                 `json:"description,omitempty"`
	Images        []LocationImageResponse `json:"images"`
	Professionals []ProfessionalResponse  `json:"professionals,omitempty"`
	CreatedAt     string                  `json:"created_at"`
}

type LocationImageResponse struct {
	ID           string `json:"id"`
	ImageURL     string `json:"image_url"`
	DisplayOrder int    `json:"display_order"`
}

type LocationListResponse struct {
	Locations []LocationResponse `json:"locations"`
	Total     int                `json:"total"`
	Page      int                `json:"page"`
	PerPage   int                `json:"per_page"`
}

type ProfessionalResponse struct {
	ID              string  `json:"id"`
	FullName        string  `json:"full_name"`
	ProfileImageURL *string `json:"profile_image_url,omitempty"`
	Bio             *string `json:"bio,omitempty"`
	RoleDescription *string `json:"role_description,omitempty"`
}
