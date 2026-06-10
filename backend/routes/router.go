package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"gymapp-backend/config"
	"gymapp-backend/controllers"
	"gymapp-backend/middleware"
)

func Setup(
	cfg *config.Config,
	authCtrl *controllers.AuthController,
	locationCtrl *controllers.LocationController,
	professionalCtrl *controllers.ProfessionalController,
	settingsCtrl *controllers.SettingsController,
	appointmentCtrl *controllers.AppointmentController,
) *gin.Engine {
	router := gin.Default()

	// CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	api := router.Group("/api")

	// --- Public auth routes ---
	auth := api.Group("/auth")
	{
		auth.POST("/register", authCtrl.Register)
		auth.POST("/login", authCtrl.Login)
		auth.POST("/refresh", authCtrl.Refresh)
		auth.POST("/logout", authCtrl.Logout)
	}

	// --- Public location, professional, availability routes ---
	api.GET("/locations", locationCtrl.List)
	api.GET("/locations/:id", locationCtrl.GetByID)
	api.GET("/professionals", professionalCtrl.ListByLocation)
	api.GET("/professionals/:id", professionalCtrl.GetByID)
	api.GET("/availability", appointmentCtrl.GetAvailability)

	// --- Protected routes (any authenticated user) ---
	protected := api.Group("")
	protected.Use(middleware.AuthRequired(cfg.JWTSecret))
	{
		protected.GET("/users/me", authCtrl.Me)
		protected.GET("/users/me/settings", settingsCtrl.Get)
		protected.PUT("/users/me/settings", settingsCtrl.Update)
		protected.GET("/users/me/locations", locationCtrl.ListByOwner)
		protected.GET("/professionals/search", professionalCtrl.Search)
		protected.GET("/professionals/my-staff", professionalCtrl.ListMyStaff)
		protected.POST("/professionals/link", professionalCtrl.LinkToLocation)
		protected.POST("/professionals/unlink", professionalCtrl.UnlinkFromLocation)

		// Appointments
		protected.POST("/appointments", appointmentCtrl.Create)
		protected.GET("/appointments", appointmentCtrl.ListMine)
		protected.GET("/appointments/:id", appointmentCtrl.GetByID)
		protected.PUT("/appointments/:id/status", appointmentCtrl.UpdateStatus)
		protected.PUT("/appointments/:id/reschedule", appointmentCtrl.Reschedule)
	}

	// --- Professional-only routes ---
	proOnly := api.Group("")
	proOnly.Use(middleware.AuthRequired(cfg.JWTSecret))
	proOnly.Use(middleware.ProfessionalOnly())
	{
		proOnly.POST("/locations", locationCtrl.Create)
		proOnly.PUT("/locations/:id", locationCtrl.Update)
		proOnly.DELETE("/locations/:id", locationCtrl.Delete)

		// Schedule management
		proOnly.GET("/dashboard/today", appointmentCtrl.GetToday)
		proOnly.GET("/schedule/working-hours", appointmentCtrl.GetWorkingHours)
		proOnly.PUT("/schedule/working-hours", appointmentCtrl.UpdateWorkingHours)
		proOnly.POST("/schedule/working-hours", appointmentCtrl.CreateWorkingHours)
		proOnly.POST("/schedule/blocks", appointmentCtrl.CreateBlock)
		proOnly.DELETE("/schedule/blocks/:id", appointmentCtrl.DeleteBlock)
	}

	return router
}
