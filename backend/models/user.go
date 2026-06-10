package models

import "time"

type UserRole string

const (
	RoleClient       UserRole = "CLIENT"
	RoleProfessional UserRole = "PROFESSIONAL"
)

type User struct {
	ID              string    `json:"id"`
	Role            UserRole  `json:"role"`
	FullName        string    `json:"full_name"`
	PasswordHash    string    `json:"-"`
	Email           *string   `json:"email"`
	ProfileImageURL *string   `json:"profile_image_url,omitempty"`
	Bio             *string   `json:"bio,omitempty"`
	IsSelfEmployed  bool      `json:"is_self_employed"`
	CreatedAt       time.Time `json:"created_at"`
}
