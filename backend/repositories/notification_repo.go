package repositories

import (
	"database/sql"
	"time"

	"gymapp-backend/models"
)

type NotificationRepo struct {
	db *sql.DB
}

func NewNotificationRepo(db *sql.DB) *NotificationRepo {
	return &NotificationRepo{db: db}
}

// --- Notification queue ---

func (r *NotificationRepo) Create(n *models.Notification) error {
	return r.db.QueryRow(
		`INSERT INTO notifications (user_id, appointment_id, type, channel, title, body, status, scheduled_for)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, created_at`,
		n.UserID, n.AppointmentID, n.Type, n.Channel, n.Title, n.Body, n.Status, n.ScheduledFor,
	).Scan(&n.ID, &n.CreatedAt)
}

// DuePending returns pending notifications whose scheduled_for has passed
// (or is null = send immediately), oldest first.
func (r *NotificationRepo) DuePending(now time.Time, limit int) ([]models.Notification, error) {
	rows, err := r.db.Query(
		`SELECT id, user_id, appointment_id, type, channel, title, body, status, scheduled_for, attempts, sent_at, created_at
		 FROM notifications
		 WHERE status = $1 AND (scheduled_for IS NULL OR scheduled_for <= $2)
		 ORDER BY created_at
		 LIMIT $3`,
		models.NotifPending, now, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.Notification
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.AppointmentID, &n.Type, &n.Channel,
			&n.Title, &n.Body, &n.Status, &n.ScheduledFor, &n.Attempts, &n.SentAt, &n.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, nil
}

func (r *NotificationRepo) MarkSent(id string) error {
	_, err := r.db.Exec(
		`UPDATE notifications SET status = $1, sent_at = CURRENT_TIMESTAMP, attempts = attempts + 1 WHERE id = $2`,
		models.NotifSent, id,
	)
	return err
}

// MarkFailed increments attempts; after maxAttempts the row is parked as failed.
func (r *NotificationRepo) MarkFailed(id string, maxAttempts int) error {
	_, err := r.db.Exec(
		`UPDATE notifications
		 SET attempts = attempts + 1,
		     status = CASE WHEN attempts + 1 >= $2 THEN $3 ELSE status END
		 WHERE id = $1`,
		id, maxAttempts, models.NotifFailed,
	)
	return err
}

func (r *NotificationRepo) MarkSkipped(id string) error {
	_, err := r.db.Exec(`UPDATE notifications SET status = $1 WHERE id = $2`, models.NotifSkipped, id)
	return err
}

// CancelForAppointment skips still-pending notifications for a cancelled appointment.
func (r *NotificationRepo) CancelForAppointment(appointmentID string) error {
	_, err := r.db.Exec(
		`UPDATE notifications SET status = $1 WHERE appointment_id = $2 AND status = $3`,
		models.NotifSkipped, appointmentID, models.NotifPending,
	)
	return err
}

// --- Telegram accounts ---

func (r *NotificationRepo) LinkTelegram(userID string, chatID int64, username string) error {
	// A chat may previously belong to another user (re-link); take it over.
	_, err := r.db.Exec(`DELETE FROM telegram_accounts WHERE chat_id = $1 AND user_id <> $2`, chatID, userID)
	if err != nil {
		return err
	}
	_, err = r.db.Exec(
		`INSERT INTO telegram_accounts (user_id, chat_id, username)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (user_id) DO UPDATE SET chat_id = EXCLUDED.chat_id, username = EXCLUDED.username, linked_at = CURRENT_TIMESTAMP`,
		userID, chatID, username,
	)
	return err
}

func (r *NotificationRepo) FindTelegramChatID(userID string) (int64, bool, error) {
	var chatID int64
	err := r.db.QueryRow(`SELECT chat_id FROM telegram_accounts WHERE user_id = $1`, userID).Scan(&chatID)
	if err == sql.ErrNoRows {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	return chatID, true, nil
}

// --- Telegram link codes ---

func (r *NotificationRepo) CreateLinkCode(code, userID string, expiresAt time.Time) error {
	_, err := r.db.Exec(
		`INSERT INTO telegram_link_codes (code, user_id, expires_at) VALUES ($1, $2, $3)`,
		code, userID, expiresAt,
	)
	return err
}

// ConsumeLinkCode resolves a non-expired code to its user and deletes it (single use).
func (r *NotificationRepo) ConsumeLinkCode(code string) (string, bool, error) {
	var userID string
	err := r.db.QueryRow(
		`DELETE FROM telegram_link_codes WHERE code = $1 AND expires_at > CURRENT_TIMESTAMP RETURNING user_id`,
		code,
	).Scan(&userID)
	if err == sql.ErrNoRows {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return userID, true, nil
}
