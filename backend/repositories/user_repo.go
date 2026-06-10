package repositories

import (
	"database/sql"

	"gymapp-backend/models"
)

type UserRepo struct {
	db *sql.DB
}

func NewUserRepo(db *sql.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(user *models.User) error {
	return r.db.QueryRow(
		`INSERT INTO users (role, full_name, password_hash, email)
		 VALUES ($1, $2, $3, NULLIF($4, ''))
		 RETURNING id, created_at`,
		user.Role, user.FullName, user.PasswordHash, user.Email,
	).Scan(&user.ID, &user.CreatedAt)
}

func (r *UserRepo) FindByEmail(email string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(
		`SELECT id, role, full_name, password_hash, email, is_self_employed, created_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Role, &user.FullName, &user.PasswordHash, &user.Email, &user.IsSelfEmployed, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) FindByPhone(phone string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(
		`SELECT u.id, u.role, u.full_name, u.password_hash, u.email, u.is_self_employed, u.created_at
		 FROM users u
		 JOIN user_phones up ON u.id = up.user_id
		 WHERE up.phone_number = $1`,
		phone,
	).Scan(&user.ID, &user.Role, &user.FullName, &user.PasswordHash, &user.Email, &user.IsSelfEmployed, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) FindByID(id string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(
		`SELECT id, role, full_name, password_hash, email, profile_image_url, bio, is_self_employed, created_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Role, &user.FullName, &user.PasswordHash, &user.Email, &user.ProfileImageURL, &user.Bio, &user.IsSelfEmployed, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) SearchProfessionals(query string, limit, offset int) ([]models.User, int, error) {
	searchPattern := "%" + query + "%"
	var total int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM users u
		 LEFT JOIN user_phones up ON u.id = up.user_id
		 WHERE u.role = 'PROFESSIONAL'
		   AND (u.full_name ILIKE $1 OR up.phone_number ILIKE $1 OR u.email ILIKE $1)`,
		searchPattern,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		`SELECT DISTINCT u.id, u.role, u.full_name, u.email, u.profile_image_url, u.bio, u.is_self_employed, u.created_at
		 FROM users u
		 LEFT JOIN user_phones up ON u.id = up.user_id
		 WHERE u.role = 'PROFESSIONAL'
		   AND (u.full_name ILIKE $1 OR up.phone_number ILIKE $1 OR u.email ILIKE $1)
		 ORDER BY u.full_name ASC
		 LIMIT $2 OFFSET $3`,
		searchPattern, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Role, &u.FullName, &u.Email, &u.ProfileImageURL, &u.Bio, &u.IsSelfEmployed, &u.CreatedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	return users, total, nil
}

func (r *UserRepo) ListProfessionals(limit, offset int) ([]models.User, int, error) {
	var total int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM users WHERE role = 'PROFESSIONAL'`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		`SELECT id, role, full_name, email, profile_image_url, bio, is_self_employed, created_at
		 FROM users WHERE role = 'PROFESSIONAL'
		 ORDER BY full_name ASC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Role, &u.FullName, &u.Email, &u.ProfileImageURL, &u.Bio, &u.IsSelfEmployed, &u.CreatedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	return users, total, nil
}

func (r *UserRepo) FindPhoneByUserID(userID string) (string, error) {
	var phone string
	err := r.db.QueryRow(`SELECT phone_number FROM user_phones WHERE user_id = $1 AND is_primary = true LIMIT 1`, userID).Scan(&phone)
	if err != nil {
		return "", err
	}
	return phone, nil
}

func (r *UserRepo) EmailExists(email string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email).Scan(&exists)
	return exists, err
}
