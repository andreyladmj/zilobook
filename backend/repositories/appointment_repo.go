package repositories

import (
	"database/sql"
	"fmt"
	"time"

	"gymapp-backend/models"
)

type AppointmentRepo struct {
	db *sql.DB
}

func NewAppointmentRepo(db *sql.DB) *AppointmentRepo {
	return &AppointmentRepo{db: db}
}

func (r *AppointmentRepo) Create(appt *models.Appointment) error {
	return r.db.QueryRow(
		`INSERT INTO appointments (location_id, professional_id, client_id, start_time, end_time, status, client_notes)
		 VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''))
		 RETURNING id, created_at`,
		appt.LocationID, appt.ProfessionalID, appt.ClientID,
		appt.StartTime, appt.EndTime, appt.Status, appt.ClientNotes,
	).Scan(&appt.ID, &appt.CreatedAt)
}

func (r *AppointmentRepo) FindByID(id string) (*models.Appointment, error) {
	appt := &models.Appointment{}
	err := r.db.QueryRow(
		`SELECT id, location_id, professional_id, client_id, start_time, end_time, status, client_notes, created_at
		 FROM appointments WHERE id = $1`,
		id,
	).Scan(&appt.ID, &appt.LocationID, &appt.ProfessionalID, &appt.ClientID,
		&appt.StartTime, &appt.EndTime, &appt.Status, &appt.ClientNotes, &appt.CreatedAt)
	if err != nil {
		return nil, err
	}
	return appt, nil
}

func (r *AppointmentRepo) FindByProfessionalAndDateRange(proID string, start, end time.Time) ([]models.Appointment, error) {
	rows, err := r.db.Query(
		`SELECT id, location_id, professional_id, client_id, start_time, end_time, status, client_notes, created_at
		 FROM appointments
		 WHERE professional_id = $1 AND start_time < $3 AND end_time > $2
		 AND status NOT IN ('Cancelled')
		 ORDER BY start_time`,
		proID, start, end,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *AppointmentRepo) FindByClientID(clientID string, page, perPage int) ([]models.Appointment, int, error) {
	return r.findPaginated("client_id", clientID, page, perPage)
}

func (r *AppointmentRepo) FindByProfessionalID(proID string, page, perPage int) ([]models.Appointment, int, error) {
	return r.findPaginated("professional_id", proID, page, perPage)
}

func (r *AppointmentRepo) Reschedule(id string, newStart, newEnd time.Time) error {
	_, err := r.db.Exec(`UPDATE appointments SET start_time = $1, end_time = $2 WHERE id = $3`, newStart, newEnd, id)
	return err
}

func (r *AppointmentRepo) UpdateStatus(id string, status models.AppointmentStatus) error {
	_, err := r.db.Exec(`UPDATE appointments SET status = $1 WHERE id = $2`, status, id)
	return err
}

func (r *AppointmentRepo) CountTodayByProfessional(proID string, dayStart, dayEnd time.Time) (int, int, error) {
	var total, pending int
	err := r.db.QueryRow(
		`SELECT
		   COUNT(*) FILTER (WHERE status != 'Cancelled'),
		   COUNT(*) FILTER (WHERE status = 'Pending')
		 FROM appointments
		 WHERE professional_id = $1 AND start_time >= $2 AND start_time < $3`,
		proID, dayStart, dayEnd,
	).Scan(&total, &pending)
	return total, pending, err
}

func (r *AppointmentRepo) findPaginated(field, value string, page, perPage int) ([]models.Appointment, int, error) {
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM appointments WHERE %s = $1", field)
	if err := r.db.QueryRow(countQuery, value).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	query := fmt.Sprintf(
		`SELECT id, location_id, professional_id, client_id, start_time, end_time, status, client_notes, created_at
		 FROM appointments WHERE %s = $1 ORDER BY start_time DESC LIMIT $2 OFFSET $3`,
		field,
	)
	rows, err := r.db.Query(query, value, perPage, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	appts, err := r.scanRows(rows)
	return appts, total, err
}

func (r *AppointmentRepo) scanRows(rows *sql.Rows) ([]models.Appointment, error) {
	var appts []models.Appointment
	for rows.Next() {
		var a models.Appointment
		if err := rows.Scan(&a.ID, &a.LocationID, &a.ProfessionalID, &a.ClientID,
			&a.StartTime, &a.EndTime, &a.Status, &a.ClientNotes, &a.CreatedAt); err != nil {
			return nil, err
		}
		appts = append(appts, a)
	}
	return appts, nil
}

func (r *AppointmentRepo) ClaimOpenSlot(id string, clientID string, status models.AppointmentStatus, notes *string) error {
	_, err := r.db.Exec(
		`UPDATE appointments 
		 SET client_id = $1, status = $2, client_notes = COALESCE($3, client_notes) 
		 WHERE id = $4`,
		clientID, status, notes, id,
	)
	return err
}
