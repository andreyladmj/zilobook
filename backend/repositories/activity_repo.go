package repositories

import (
	"database/sql"

	"gymapp-backend/models"
)

type ActivityRepo struct {
	db *sql.DB
}

func NewActivityRepo(db *sql.DB) *ActivityRepo {
	return &ActivityRepo{db: db}
}

func (r *ActivityRepo) Create(log *models.ActivityLog) error {
	return r.db.QueryRow(
		`INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
		 VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
		 RETURNING id, created_at`,
		log.UserID, log.Action, log.EntityType, log.EntityID, log.Metadata, log.IPAddress, log.UserAgent,
	).Scan(&log.ID, &log.CreatedAt)
}
