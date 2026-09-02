package repositories

import (
	"database/sql"
	"fmt"
	"strings"

	"gymapp-backend/dto"
	"gymapp-backend/models"
	"gymapp-backend/utils"
)

type LocationRepo struct {
	db *sql.DB
}

func NewLocationRepo(db *sql.DB) *LocationRepo {
	return &LocationRepo{db: db}
}

func (r *LocationRepo) Create(loc *models.Location) error {
	slug := utils.GenerateSlug(loc.Name)

	// Handle slug uniqueness
	baseSlug := slug
	for i := 1; ; i++ {
		var exists bool
		err := r.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM locations WHERE title_slug = $1)`, slug).Scan(&exists)
		if err != nil {
			return err
		}
		if !exists {
			break
		}
		slug = fmt.Sprintf("%s-%d", baseSlug, i)
	}

	loc.TitleSlug = slug
	return r.db.QueryRow(
		`INSERT INTO locations (owner_id, name, title_slug, type, address, description)
		 VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''))
		 RETURNING id, created_at`,
		loc.OwnerID, loc.Name, loc.TitleSlug, loc.Type, loc.Address, loc.Description,
	).Scan(&loc.ID, &loc.CreatedAt)
}

func (r *LocationRepo) FindByID(id string) (*models.Location, error) {
	loc := &models.Location{}
	err := r.db.QueryRow(
		`SELECT id, owner_id, name, title_slug, type, address, description, created_at
		 FROM locations WHERE id = $1`,
		id,
	).Scan(&loc.ID, &loc.OwnerID, &loc.Name, &loc.TitleSlug, &loc.Type, &loc.Address, &loc.Description, &loc.CreatedAt)
	if err != nil {
		return nil, err
	}
	return loc, nil
}

func (r *LocationRepo) FindBySlug(slug string) (*models.Location, error) {
	loc := &models.Location{}
	err := r.db.QueryRow(
		`SELECT id, owner_id, name, title_slug, type, address, description, created_at
		 FROM locations WHERE title_slug = $1`,
		slug,
	).Scan(&loc.ID, &loc.OwnerID, &loc.Name, &loc.TitleSlug, &loc.Type, &loc.Address, &loc.Description, &loc.CreatedAt)
	if err != nil {
		return nil, err
	}
	return loc, nil
}

func (r *LocationRepo) FindAll(locationType, search string, page, perPage int) ([]models.Location, int, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if locationType != "" {
		conditions = append(conditions, fmt.Sprintf("type = $%d", argIdx))
		args = append(args, locationType)
		argIdx++
	}
	if search != "" {
		conditions = append(conditions, fmt.Sprintf("(LOWER(name) LIKE $%d OR LOWER(address) LIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+strings.ToLower(search)+"%")
		argIdx++
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count
	var total int
	err := r.db.QueryRow("SELECT COUNT(*) FROM locations "+where, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Fetch
	offset := (page - 1) * perPage
	args = append(args, perPage, offset)
	query := fmt.Sprintf(
		"SELECT id, owner_id, name, title_slug, type, address, description, created_at FROM locations %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d",
		where, argIdx, argIdx+1,
	)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var locations []models.Location
	for rows.Next() {
		var loc models.Location
		if err := rows.Scan(&loc.ID, &loc.OwnerID, &loc.Name, &loc.TitleSlug, &loc.Type, &loc.Address, &loc.Description, &loc.CreatedAt); err != nil {
			return nil, 0, err
		}
		locations = append(locations, loc)
	}
	return locations, total, nil
}

func (r *LocationRepo) FindByOwnerID(ownerID string) ([]models.Location, error) {
	rows, err := r.db.Query(
		`SELECT id, owner_id, name, title_slug, type, address, description, created_at
		 FROM locations WHERE owner_id = $1 ORDER BY created_at DESC`,
		ownerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var locations []models.Location
	for rows.Next() {
		var loc models.Location
		if err := rows.Scan(&loc.ID, &loc.OwnerID, &loc.Name, &loc.TitleSlug, &loc.Type, &loc.Address, &loc.Description, &loc.CreatedAt); err != nil {
			return nil, err
		}
		locations = append(locations, loc)
	}
	return locations, nil
}

func (r *LocationRepo) Update(loc *models.Location) error {
	loc.TitleSlug = utils.GenerateSlug(loc.Name)
	_, err := r.db.Exec(
		`UPDATE locations SET name = $1, title_slug = $2, type = $3, address = $4, description = NULLIF($5, '')
		 WHERE id = $6`,
		loc.Name, loc.TitleSlug, loc.Type, loc.Address, loc.Description, loc.ID,
	)
	return err
}

func (r *LocationRepo) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM locations WHERE id = $1`, id)
	return err
}

func (r *LocationRepo) FindImagesByLocationID(locationID string) ([]models.LocationImage, error) {
	rows, err := r.db.Query(
		`SELECT id, location_id, image_url, display_order
		 FROM location_images WHERE location_id = $1 ORDER BY display_order`,
		locationID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []models.LocationImage
	for rows.Next() {
		var img models.LocationImage
		if err := rows.Scan(&img.ID, &img.LocationID, &img.ImageURL, &img.DisplayOrder); err != nil {
			return nil, err
		}
		images = append(images, img)
	}
	return images, nil
}

func (r *LocationRepo) CreateImage(img *models.LocationImage) error {
	return r.db.QueryRow(
		`INSERT INTO location_images (location_id, image_url, display_order)
		 VALUES ($1, $2, $3) RETURNING id`,
		img.LocationID, img.ImageURL, img.DisplayOrder,
	).Scan(&img.ID)
}

func (r *LocationRepo) DeleteImage(imageID string) error {
	_, err := r.db.Exec(`DELETE FROM location_images WHERE id = $1`, imageID)
	return err
}

func (r *LocationRepo) LinkProfessionalToLocation(professionalID, locationID string) error {
	_, err := r.db.Exec(
		`INSERT INTO professional_locations (professional_id, location_id)
		 VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		professionalID, locationID,
	)
	return err
}

func (r *LocationRepo) UnlinkProfessionalFromLocation(professionalID, locationID string) error {
	_, err := r.db.Exec(
		`DELETE FROM professional_locations WHERE professional_id = $1 AND location_id = $2`,
		professionalID, locationID,
	)
	return err
}

func (r *LocationRepo) FindProfessionalsByOwnerLocations(ownerID string, search string, limit, offset int) ([]dto.ProfessionalResponse, int, error) {
	searchPattern := "%" + search + "%"
	var total int

	countQuery := `SELECT COUNT(DISTINCT u.id) FROM professional_locations pl
		JOIN users u ON pl.professional_id = u.id
		JOIN locations l ON pl.location_id = l.id
		WHERE l.owner_id = $1`
	countArgs := []any{ownerID}
	if search != "" {
		countQuery += ` AND u.full_name ILIKE $2`
		countArgs = append(countArgs, searchPattern)
	}
	if err := r.db.QueryRow(countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, err
	}

	dataQuery := `SELECT DISTINCT u.id, u.full_name, u.profile_image_url, u.bio, pl.role_description
		FROM professional_locations pl
		JOIN users u ON pl.professional_id = u.id
		JOIN locations l ON pl.location_id = l.id
		WHERE l.owner_id = $1`
	dataArgs := []any{ownerID}
	if search != "" {
		dataQuery += ` AND u.full_name ILIKE $2`
		dataArgs = append(dataArgs, searchPattern)
		dataQuery += ` ORDER BY u.full_name ASC LIMIT $3 OFFSET $4`
		dataArgs = append(dataArgs, limit, offset)
	} else {
		dataQuery += ` ORDER BY u.full_name ASC LIMIT $2 OFFSET $3`
		dataArgs = append(dataArgs, limit, offset)
	}

	rows, err := r.db.Query(dataQuery, dataArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var pros []dto.ProfessionalResponse
	for rows.Next() {
		var p dto.ProfessionalResponse
		if err := rows.Scan(&p.ID, &p.FullName, &p.ProfileImageURL, &p.Bio, &p.RoleDescription); err != nil {
			return nil, 0, err
		}
		pros = append(pros, p)
	}
	return pros, total, nil
}

func (r *LocationRepo) FindProfessionalsByLocationID(locationID string) ([]dto.ProfessionalResponse, error) {
	rows, err := r.db.Query(
		`SELECT u.id, u.full_name, u.profile_image_url, u.bio, pl.role_description
		 FROM professional_locations pl
		 JOIN users u ON pl.professional_id = u.id
		 WHERE pl.location_id = $1`,
		locationID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pros []dto.ProfessionalResponse
	for rows.Next() {
		var p dto.ProfessionalResponse
		if err := rows.Scan(&p.ID, &p.FullName, &p.ProfileImageURL, &p.Bio, &p.RoleDescription); err != nil {
			return nil, err
		}
		pros = append(pros, p)
	}
	return pros, nil
}
