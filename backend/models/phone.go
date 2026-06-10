package models

type UserPhone struct {
	ID          string `json:"id"`
	UserID      string `json:"user_id"`
	PhoneNumber string `json:"phone_number"`
	IsPrimary   bool   `json:"is_primary"`
	IsVerified  bool   `json:"is_verified"`
}
