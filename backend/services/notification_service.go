package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"strings"
	"time"

	"gymapp-backend/models"
	"gymapp-backend/repositories"
	"gymapp-backend/telegram"
)

const (
	notifMaxAttempts   = 3
	notifBatchSize     = 50
	dispatchInterval   = 60 * time.Second
	linkCodeTTL        = 1 * time.Hour
	longPollTimeoutSec = 50
)

// NotificationService enqueues booking notifications and runs two background
// loops: a dispatcher (delivers due notifications) and a Telegram bot poller
// (handles account linking). Disabled (no-op) when no bot token is configured.
type NotificationService struct {
	repo        *repositories.NotificationRepo
	userRepo    *repositories.UserRepo
	tg          *telegram.Client
	botUsername string
	loc         *time.Location
	enabled     bool
}

func NewNotificationService(
	repo *repositories.NotificationRepo,
	userRepo *repositories.UserRepo,
	botToken, botUsername string,
) *NotificationService {
	loc, err := time.LoadLocation("Europe/Kyiv")
	if err != nil {
		// Windows dev boxes lack the tz database; fall back to a fixed offset.
		loc = time.FixedZone("EET", 2*60*60)
	}
	s := &NotificationService{
		repo:        repo,
		userRepo:    userRepo,
		botUsername: botUsername,
		loc:         loc,
		enabled:     botToken != "",
	}
	if s.enabled {
		s.tg = telegram.NewClient(botToken)
	}
	return s
}

// Start launches the dispatcher and bot polling loops. No-op if disabled.
func (s *NotificationService) Start() {
	if !s.enabled {
		log.Println("Notifications: Telegram disabled (no TELEGRAM_BOT_TOKEN), skipping dispatcher")
		return
	}
	log.Println("Notifications: Telegram enabled, starting dispatcher + bot poller")
	go s.dispatchLoop()
	go s.botLoop()
}

// EnqueueBooking schedules the confirmation + reminders for a new appointment,
// and a new-booking ping to the professional. When confirmed is false the
// booking awaits the pro's approval, so the client gets no "confirmed" message
// or reminders yet. Safe to call when disabled.
func (s *NotificationService) EnqueueBooking(appointmentID, professionalID string, clientID *string, start time.Time, reminderHours int, confirmed bool) {
	if !s.enabled {
		return
	}

	proName := s.userName(professionalID)
	when := start.In(s.loc)

	// To the client: confirmation now + reminders before the appointment.
	if clientID != nil && confirmed {
		s.enqueue(&models.Notification{
			UserID:        *clientID,
			AppointmentID: &appointmentID,
			Type:          models.NotifBookingConfirmation,
			Channel:       models.ChannelTelegram,
			Body:          fmt.Sprintf("✅ Запис підтверджено!\n%s\nМайстер: %s\n\nМи нагадаємо вам напередодні.", formatUA(when), proName),
		})

		if reminderHours <= 0 {
			reminderHours = 2
		}
		s.scheduleReminder(appointmentID, *clientID, start, 24*time.Hour, when, proName)
		s.scheduleReminder(appointmentID, *clientID, start, time.Duration(reminderHours)*time.Hour, when, proName)
	}

	// To the professional: new-booking ping now.
	clientName := "клієнт"
	if clientID != nil {
		clientName = s.userName(*clientID)
	}
	proBody := fmt.Sprintf("📅 Новий запис\n%s — %s", clientName, formatUA(when))
	if !confirmed {
		proBody = fmt.Sprintf("📅 Новий запис (очікує підтвердження)\n%s — %s", clientName, formatUA(when))
	}
	s.enqueue(&models.Notification{
		UserID:        professionalID,
		AppointmentID: &appointmentID,
		Type:          models.NotifNewBooking,
		Channel:       models.ChannelTelegram,
		Body:          proBody,
	})
}

// scheduleReminder enqueues a reminder only if its fire time is still in the future.
func (s *NotificationService) scheduleReminder(appointmentID, clientID string, start time.Time, before time.Duration, when time.Time, proName string) {
	fireAt := start.Add(-before)
	if time.Until(fireAt) <= 0 {
		return // booking made closer than this reminder window
	}
	s.enqueue(&models.Notification{
		UserID:        clientID,
		AppointmentID: &appointmentID,
		Type:          models.NotifReminder,
		Channel:       models.ChannelTelegram,
		Body:          fmt.Sprintf("⏰ Нагадування про запис\n%s\nМайстер: %s", formatUA(when), proName),
		ScheduledFor:  &fireAt,
	})
}

func (s *NotificationService) enqueue(n *models.Notification) {
	n.Status = models.NotifPending
	if err := s.repo.Create(n); err != nil {
		log.Printf("Notifications: failed to enqueue %s for %s: %v", n.Type, n.UserID, err)
	}
}

// CancelForAppointment drops still-pending notifications when an appointment is cancelled.
func (s *NotificationService) CancelForAppointment(appointmentID string) {
	if !s.enabled {
		return
	}
	if err := s.repo.CancelForAppointment(appointmentID); err != nil {
		log.Printf("Notifications: failed to cancel notifications for appointment %s: %v", appointmentID, err)
	}
}

// GenerateLinkCode creates a one-time deep link the user opens to link Telegram.
func (s *NotificationService) GenerateLinkCode(userID string) (string, error) {
	if !s.enabled {
		return "", fmt.Errorf("telegram notifications are not configured")
	}
	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	code := hex.EncodeToString(buf)
	if err := s.repo.CreateLinkCode(code, userID, time.Now().Add(linkCodeTTL)); err != nil {
		return "", err
	}
	return fmt.Sprintf("https://t.me/%s?start=%s", s.botUsername, code), nil
}

// IsLinked reports whether the user already connected Telegram.
func (s *NotificationService) IsLinked(userID string) bool {
	if !s.enabled {
		return false
	}
	_, linked, _ := s.repo.FindTelegramChatID(userID)
	return linked
}

func (s *NotificationService) Enabled() bool { return s.enabled }

// --- background loops ---

func (s *NotificationService) dispatchLoop() {
	ticker := time.NewTicker(dispatchInterval)
	defer ticker.Stop()
	s.dispatchDue() // run once on boot
	for range ticker.C {
		s.dispatchDue()
	}
}

func (s *NotificationService) dispatchDue() {
	due, err := s.repo.DuePending(time.Now(), notifBatchSize)
	if err != nil {
		log.Printf("Notifications: dispatch query failed: %v", err)
		return
	}
	for i := range due {
		s.deliver(&due[i])
	}
}

func (s *NotificationService) deliver(n *models.Notification) {
	if n.Channel != models.ChannelTelegram {
		// SMS/other channels not wired yet — park so the queue stays clean.
		_ = s.repo.MarkSkipped(n.ID)
		return
	}

	chatID, linked, err := s.repo.FindTelegramChatID(n.UserID)
	if err != nil {
		log.Printf("Notifications: lookup chat for %s failed: %v", n.UserID, err)
		_ = s.repo.MarkFailed(n.ID, notifMaxAttempts)
		return
	}
	if !linked {
		// User never connected Telegram — can't deliver this one.
		_ = s.repo.MarkSkipped(n.ID)
		return
	}

	if err := s.tg.SendMessage(chatID, n.Body); err != nil {
		log.Printf("Notifications: send to %s failed: %v", n.UserID, err)
		_ = s.repo.MarkFailed(n.ID, notifMaxAttempts)
		return
	}
	_ = s.repo.MarkSent(n.ID)
}

func (s *NotificationService) botLoop() {
	var offset int64
	for {
		updates, err := s.tg.GetUpdates(offset, longPollTimeoutSec)
		if err != nil {
			log.Printf("Notifications: getUpdates failed: %v", err)
			time.Sleep(5 * time.Second)
			continue
		}
		for _, u := range updates {
			offset = u.UpdateID + 1
			if u.Message != nil {
				s.handleMessage(u.Message)
			}
		}
	}
}

func (s *NotificationService) handleMessage(m *telegram.Message) {
	text := strings.TrimSpace(m.Text)

	// /start <code> — link the account.
	if strings.HasPrefix(text, "/start") {
		parts := strings.Fields(text)
		if len(parts) >= 2 {
			s.handleLink(m, parts[1])
			return
		}
		_ = s.tg.SendMessage(m.Chat.ID,
			"Вітаю! Це бот нагадувань Zilobook 🗓\nЩоб отримувати нагадування про записи, відкрийте посилання «Підключити Telegram» на сторінці вашого запису.")
		return
	}

	_ = s.tg.SendMessage(m.Chat.ID,
		"Я надсилаю нагадування про ваші записи. Керувати записами можна у застосунку Zilobook.")
}

func (s *NotificationService) handleLink(m *telegram.Message, code string) {
	userID, ok, err := s.repo.ConsumeLinkCode(code)
	if err != nil {
		log.Printf("Notifications: consume link code failed: %v", err)
		_ = s.tg.SendMessage(m.Chat.ID, "Сталася помилка. Спробуйте ще раз пізніше.")
		return
	}
	if !ok {
		_ = s.tg.SendMessage(m.Chat.ID, "Це посилання недійсне або застаріле. Відкрийте його знову зі сторінки запису.")
		return
	}

	username := ""
	if m.From != nil {
		username = m.From.Username
	}
	if err := s.repo.LinkTelegram(userID, m.Chat.ID, username); err != nil {
		log.Printf("Notifications: link telegram failed: %v", err)
		_ = s.tg.SendMessage(m.Chat.ID, "Не вдалося підключити. Спробуйте ще раз.")
		return
	}
	_ = s.tg.SendMessage(m.Chat.ID, "✅ Telegram підключено! Тепер ви отримуватимете нагадування про записи.")
}

func (s *NotificationService) userName(userID string) string {
	u, err := s.userRepo.FindByID(userID)
	if err != nil || u == nil {
		return "майстер"
	}
	return u.FullName
}

// --- Ukrainian date formatting (Go's time package has no localization) ---

var uaMonths = [...]string{
	"", "січня", "лютого", "березня", "квітня", "травня", "червня",
	"липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
}

var uaWeekdays = map[time.Weekday]string{
	time.Monday: "понеділок", time.Tuesday: "вівторок", time.Wednesday: "середа",
	time.Thursday: "четвер", time.Friday: "п'ятниця", time.Saturday: "субота", time.Sunday: "неділя",
}

// formatUA renders e.g. "понеділок, 15 червня о 14:30".
func formatUA(t time.Time) string {
	return fmt.Sprintf("%s, %d %s о %02d:%02d",
		uaWeekdays[t.Weekday()], t.Day(), uaMonths[t.Month()], t.Hour(), t.Minute())
}
