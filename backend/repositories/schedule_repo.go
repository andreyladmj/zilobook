package repositories

import (
	"database/sql"
	"time"

	"gymapp-backend/models"
)

type ScheduleRepo struct {
	db *sql.DB
}

func NewScheduleRepo(db *sql.DB) *ScheduleRepo {
	return &ScheduleRepo{db: db}
}

func (r *ScheduleRepo) FindWorkingHours(proID, locationID string, dayOfWeek int, date time.Time) ([]models.WorkingHours, error) {
	rows, err := r.db.Query(
		`SELECT id, professional_id, location_id, day_of_week, start_time::text, end_time::text, valid_from, valid_until
		 FROM professional_working_hours
		 WHERE professional_id = $1 AND location_id = $2 AND day_of_week = $3
		 AND valid_from <= $4 AND (valid_until IS NULL OR valid_until >= $4)
		 ORDER BY start_time`,
		proID, locationID, dayOfWeek, date,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var hours []models.WorkingHours
	for rows.Next() {
		var wh models.WorkingHours
		if err := rows.Scan(&wh.ID, &wh.ProfessionalID, &wh.LocationID, &wh.DayOfWeek,
			&wh.StartTime, &wh.EndTime, &wh.ValidFrom, &wh.ValidUntil); err != nil {
			return nil, err
		}
		hours = append(hours, wh)
	}
	return hours, nil
}

func (r *ScheduleRepo) FindBlocksByDateRange(proID string, start, end time.Time) ([]models.ScheduleBlock, error) {
	rows, err := r.db.Query(
		`SELECT id, professional_id, location_id, start_time, end_time, block_reason
		 FROM schedule_blocks
		 WHERE professional_id = $1 AND start_time < $3 AND end_time > $2
		 ORDER BY start_time`,
		proID, start, end,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blocks []models.ScheduleBlock
	for rows.Next() {
		var b models.ScheduleBlock
		if err := rows.Scan(&b.ID, &b.ProfessionalID, &b.LocationID, &b.StartTime, &b.EndTime, &b.BlockReason); err != nil {
			return nil, err
		}
		blocks = append(blocks, b)
	}
	return blocks, nil
}

func (r *ScheduleRepo) CreateWorkingHours(wh *models.WorkingHours) error {
	return r.db.QueryRow(
		`INSERT INTO professional_working_hours (professional_id, location_id, day_of_week, start_time, end_time, valid_from, valid_until)
		 VALUES ($1, $2, $3, $4::time, $5::time, $6, $7)
		 RETURNING id`,
		wh.ProfessionalID, wh.LocationID, wh.DayOfWeek, wh.StartTime, wh.EndTime, wh.ValidFrom, wh.ValidUntil,
	).Scan(&wh.ID)
}

func (r *ScheduleRepo) CreateBlock(block *models.ScheduleBlock) error {
	return r.db.QueryRow(
		`INSERT INTO schedule_blocks (professional_id, location_id, start_time, end_time, block_reason)
		 VALUES ($1, $2, $3, $4, NULLIF($5, ''))
		 RETURNING id`,
		block.ProfessionalID, block.LocationID, block.StartTime, block.EndTime, block.BlockReason,
	).Scan(&block.ID)
}

func (r *ScheduleRepo) DeleteBlock(id string) error {
	_, err := r.db.Exec(`DELETE FROM schedule_blocks WHERE id = $1`, id)
	return err
}

func (r *ScheduleRepo) FindBlockByID(id string) (*models.ScheduleBlock, error) {
	b := &models.ScheduleBlock{}
	err := r.db.QueryRow(
		`SELECT id, professional_id, location_id, start_time, end_time, block_reason
		 FROM schedule_blocks WHERE id = $1`,
		id,
	).Scan(&b.ID, &b.ProfessionalID, &b.LocationID, &b.StartTime, &b.EndTime, &b.BlockReason)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *ScheduleRepo) FindAllWorkingHours(proID string) ([]models.WorkingHours, error) {
	rows, err := r.db.Query(
		`SELECT id, professional_id, location_id, day_of_week, start_time::text, end_time::text, valid_from, valid_until
		 FROM professional_working_hours
		 WHERE professional_id = $1
		 ORDER BY day_of_week, start_time`,
		proID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var hours []models.WorkingHours
	for rows.Next() {
		var wh models.WorkingHours
		if err := rows.Scan(&wh.ID, &wh.ProfessionalID, &wh.LocationID, &wh.DayOfWeek,
			&wh.StartTime, &wh.EndTime, &wh.ValidFrom, &wh.ValidUntil); err != nil {
			return nil, err
		}
		hours = append(hours, wh)
	}
	return hours, nil
}

func (r *ScheduleRepo) DeleteAllWorkingHours(proID string) error {
	_, err := r.db.Exec(`DELETE FROM professional_working_hours WHERE professional_id = $1`, proID)
	return err
}
