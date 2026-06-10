package repositories

import (
	"database/sql"

	"gymapp-backend/models"
)

type PhoneRepo struct {
	db *sql.DB
}

func NewPhoneRepo(db *sql.DB) *PhoneRepo {
	return &PhoneRepo{db: db}
}

func (r *PhoneRepo) Create(phone *models.UserPhone) error {
	return r.db.QueryRow(
		`INSERT INTO user_phones (user_id, phone_number, is_primary)
		 VALUES ($1, $2, $3)
		 RETURNING id`,
		phone.UserID, phone.PhoneNumber, phone.IsPrimary,
	).Scan(&phone.ID)
}

func (r *PhoneRepo) FindPrimaryByUserID(userID string) (*models.UserPhone, error) {
	phone := &models.UserPhone{}
	err := r.db.QueryRow(
		`SELECT id, user_id, phone_number, is_primary, is_verified
		 FROM user_phones WHERE user_id = $1 AND is_primary = true`,
		userID,
	).Scan(&phone.ID, &phone.UserID, &phone.PhoneNumber, &phone.IsPrimary, &phone.IsVerified)
	if err != nil {
		return nil, err
	}
	return phone, nil
}

func (r *PhoneRepo) PhoneExists(phone string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM user_phones WHERE phone_number = $1)`, phone).Scan(&exists)
	return exists, err
}
