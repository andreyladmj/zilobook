package models

import "time"

type Location struct {
	ID          string    `json:"id"`
	OwnerID     *string   `json:"owner_id,omitempty"`
	Name        string    `json:"name"`
	TitleSlug   string    `json:"title_slug"`
	Type        string    `json:"type"`
	Address     string    `json:"address"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type LocationImage struct {
	ID           string `json:"id"`
	LocationID   string `json:"location_id"`
	ImageURL     string `json:"image_url"`
	DisplayOrder int    `json:"display_order"`
}
