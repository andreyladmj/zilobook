package main

import (
	"log"

	"gymapp-backend/config"
	"gymapp-backend/controllers"
	"gymapp-backend/database"
	"gymapp-backend/repositories"
	"gymapp-backend/routes"
	"gymapp-backend/services"
)

func main() {
	// Load config
	cfg := config.Load()

	// Connect to database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.RunMigrations(db, "migrations"); err != nil {
		log.Printf("Migration warning: %v", err)
	}

	// --- Repositories ---
	userRepo := repositories.NewUserRepo(db)
	phoneRepo := repositories.NewPhoneRepo(db)
	sessionRepo := repositories.NewSessionRepo(db)
	activityRepo := repositories.NewActivityRepo(db)
	locationRepo := repositories.NewLocationRepo(db)
	settingsRepo := repositories.NewSettingsRepo(db)
	appointmentRepo := repositories.NewAppointmentRepo(db)
	scheduleRepo := repositories.NewScheduleRepo(db)

	// --- Services ---
	activitySvc := services.NewActivityService(activityRepo)
	authService := services.NewAuthService(cfg, userRepo, phoneRepo, sessionRepo, activitySvc)
	locationSvc := services.NewLocationService(locationRepo, activitySvc)
	settingsSvc := services.NewSettingsService(settingsRepo)
	scheduleSvc := services.NewScheduleService(scheduleRepo, appointmentRepo, settingsRepo, activitySvc)
	appointmentSvc := services.NewAppointmentService(appointmentRepo, scheduleRepo, settingsRepo, userRepo, phoneRepo, activitySvc)

	// --- Controllers ---
	authCtrl := controllers.NewAuthController(authService)
	locationCtrl := controllers.NewLocationController(locationSvc)
	professionalCtrl := controllers.NewProfessionalController(locationRepo, userRepo)
	settingsCtrl := controllers.NewSettingsController(settingsSvc)
	appointmentCtrl := controllers.NewAppointmentController(appointmentSvc, scheduleSvc)

	// Setup routes and start server
	router := routes.Setup(cfg, authCtrl, locationCtrl, professionalCtrl, settingsCtrl, appointmentCtrl)

	log.Printf("Zilobook backend starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
