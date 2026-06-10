package repositories

import (
	"database/sql"
	"time"

	"gymapp-backend/models"
)

type SessionRepo struct {
	db *sql.DB
}

func NewSessionRepo(db *sql.DB) *SessionRepo {
	return &SessionRepo{db: db}
}

func (r *SessionRepo) Create(session *models.Session) error {
	return r.db.QueryRow(
		`INSERT INTO sessions (user_id, refresh_token, user_agent, ip_address, expires_at)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, created_at`,
		session.UserID, session.RefreshToken, session.UserAgent, session.IPAddress, session.ExpiresAt,
	).Scan(&session.ID, &session.CreatedAt)
}

func (r *SessionRepo) FindByRefreshToken(token string) (*models.Session, error) {
	session := &models.Session{}
	err := r.db.QueryRow(
		`SELECT id, user_id, refresh_token, user_agent, ip_address, expires_at, created_at
		 FROM sessions WHERE refresh_token = $1`,
		token,
	).Scan(&session.ID, &session.UserID, &session.RefreshToken, &session.UserAgent, &session.IPAddress, &session.ExpiresAt, &session.CreatedAt)
	if err != nil {
		return nil, err
	}
	return session, nil
}

func (r *SessionRepo) DeleteByRefreshToken(token string) error {
	_, err := r.db.Exec(`DELETE FROM sessions WHERE refresh_token = $1`, token)
	return err
}

func (r *SessionRepo) DeleteByUserID(userID string) error {
	_, err := r.db.Exec(`DELETE FROM sessions WHERE user_id = $1`, userID)
	return err
}

func (r *SessionRepo) DeleteExpired() error {
	_, err := r.db.Exec(`DELETE FROM sessions WHERE expires_at < $1`, time.Now())
	return err
}
