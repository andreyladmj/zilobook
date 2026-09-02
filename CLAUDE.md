# CLAUDE.md

# Zilobook - Claude Code Project Memory

## Project Overview
Zilobook is a unified multi-niche booking platform (evolved from a gym-only app).
Targets the Ukrainian market first (beauty/nail masters as the primary niche, then fitness trainers and auto services).
Lightweight "calendar in pocket" scheduling for Pros and Clients. Core value proposition: a no-install
booking link for the pro's Instagram/Telegram bio + no-show reduction (reminders, prepayments).

**Go-to-market:** SaaS tool for solo professionals, NOT a marketplace. The public `/explore`
discovery page exists but is hidden behind a feature flag until there is enough supply.
Release plan and checklist: see `REQUIREMENTS.md`.

## Multi-Domain Niche Architecture
One deployment serves several marketing domains; the `Host` header decides which niche a visitor sees:
- `frontend/src/lib/niches.ts` — single source of truth: niche registry (id, label, `locationType`
  matching `locations.type`, production domains, SEO meta) + `FEATURES` flags (`marketplace: false`)
  + `getNicheFromHost()`.
- `frontend/src/app/page.tsx` — resolves niche server-side: `?theme=` override (dev/demo) → domain → default.
  On a niche-locked domain the theme switcher is hidden (`lockTheme` prop on `LandingClient`).
  `generateMetadata` returns per-niche title/description.
- Visual theme tokens live in `LandingClient.tsx` (`THEMES`), keyed by the same niche ids.
- The booking page (`/location/[id]`) themes by `location.type`, not by domain.
- The pro dashboard is niche-neutral and should live on a single app domain (e.g. `app.zilobook.com`).
- Backend `CORS_ORIGIN` accepts a comma-separated list of origins (parsed in `config.go`).
- Note: Next.js 16 renamed `middleware.ts` → `proxy.ts`; we avoid both by reading `headers()` in server components.

## Tech Stack
- **Backend:** Golang + Gin framework (port 8080)
- **Frontend:** Next.js 16.2 + React 19 + TailwindCSS v4 (port 3000)
- **Database:** PostgreSQL via Docker (`zilobook-db` container, password: `secret`)
- **Auth:** JWT access tokens (15min) + refresh tokens (7 days, DB-stored, rotated on use)
- **Migrations:** golang-migrate style flat `.sql` files in `backend/migrations/`

## Backend Architecture (layered, DI-wired in main.go)
```
backend/
├── main.go              # Entry point, DI wiring
├── config/config.go     # Env: DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN
├── models/              # DB-mapped structs (all UUID primary keys)
│   ├── user.go          # User{ID, Role, FullName, PasswordHash, Email, ...}
│   ├── session.go       # Session{ID, UserID, RefreshToken, ExpiresAt, ...}
│   ├── phone.go         # UserPhone{ID, UserID, PhoneNumber, IsPrimary}
│   ├── location.go      # Location{ID, OwnerID, Name, TitleSlug, Type, ...}, LocationImage
│   ├── activity_log.go  # ActivityLog{ID, UserID, Action, EntityType, Metadata JSONB, ...}
│   ├── user_settings.go # UserSettings (theme, language, booking rules, notification prefs)
│   └── service.go       # Service catalog (name, duration, price)
├── dto/
│   ├── auth_dto.go      # RegisterRequest, LoginRequest, RefreshRequest, AuthResponse
│   ├── location_dto.go  # CreateLocationReq, LocationResponse, LocationListResponse, ProfessionalResponse
│   └── settings_dto.go  # UpdateSettingsRequest, SettingsResponse
├── utils/               # jwt.go, hash.go, response.go, slug.go
├── middleware/           # auth.go (JWT Bearer), role.go (ProfessionalOnly guard)
├── repositories/        # Raw SQL: user_repo, phone_repo, session_repo, location_repo, activity_repo, settings_repo
├── services/            # auth_service, location_service, activity_service, settings_service
├── controllers/         # auth, location_controller, professional_controller, settings_controller
├── routes/router.go     # Centralized Gin routing + CORS + middleware groups
└── migrations/                # Runner re-executes EVERY *.up.sql on each boot (alphabetical), so all files must be idempotent
    ├── 000001_init.up.sql     # Core schema (9 tables)
    ├── 000002_phase2.up.sql   # activity_log, user_settings, services, reviews, waitlist, notifications + locations.owner_id
    ├── 000003_seed_data.up.sql        # Demo pros/locations/links (password: password123, login by phone)
    ├── 000004_telegram.up.sql         # telegram_accounts, telegram_link_codes + notifications dispatch columns
    └── 000005_seed_working_hours.up.sql # Working hours for seed pros (skips pairs that already have hours)
```

## Database Schema (15 tables, all UUID PKs)
**Core (000001):** users, sessions, user_phones, locations, location_images,
professional_locations, professional_working_hours, schedule_blocks, appointments
**Phase 2 (000002):** activity_log, user_settings, services, reviews, waitlist, notifications

## Frontend Structure
```
frontend/src/
├── lib/auth.ts          # Auth API client, token storage, authFetch() with auto-refresh
├── lib/niches.ts        # Niche/domain registry, SEO meta, FEATURES flags, getNicheFromHost()
├── app/
│   ├── register/        # Sends full_name, role, phone, email, password → stores JWT
│   ├── login/           # Phone or email login → stores JWT
│   ├── dashboard/       # Protected (redirects to /login if no token), shows real user data
│   ├── explore/         # Public location discovery (HIDDEN: FEATURES.marketplace=false, reachable by URL)
│   ├── location/[id]/   # Location detail + booking flow
│   └── (landing pages)  # / resolves niche by Host header; /fitness, /beauty, /service redirect with ?theme=
```

## Working API Endpoints
### Auth (public)
- POST /api/auth/register → {access_token, refresh_token, user}
- POST /api/auth/login → phone + password (phone-only by design for now)
- POST /api/auth/refresh → token rotation
- POST /api/auth/logout → revokes refresh token
### Locations (public read, pro-only write)
- GET /api/locations → list with ?type=&search=&page=&per_page= filters
- GET /api/locations/:id → detail with images + professionals
- GET /api/locations/slug/:slug → same detail by title_slug (powers the /b/[slug] short booking link)
- POST /api/locations → create (pro only, auth required)
- PUT /api/locations/:id → update (owner only)
- DELETE /api/locations/:id → delete (owner only)
### Professionals (public)
- GET /api/professionals?location_id=X → list by location
- GET /api/professionals/:id → detail
### Booking & Availability
- GET /api/availability?professional_id=&location_id=&date= → free time slots
- POST /api/appointments → create booking (auth, checks conflicts + settings)
- GET /api/appointments → list my appointments (role-aware)
- GET /api/appointments/:id → appointment detail
- PUT /api/appointments/:id/status → confirm/cancel/complete
### Schedule Management (pro only)
- GET /api/dashboard/today?date= → today's schedule + stats
- POST /api/schedule/working-hours → set recurring hours
- POST /api/schedule/blocks → create schedule block
- DELETE /api/schedule/blocks/:id → remove block
### User (protected)
- GET /api/users/me → user_id + role
- GET /api/users/me/locations → user's own locations
- GET /api/users/me/settings → settings (auto-creates defaults)
- PUT /api/users/me/settings → partial update settings
### Notifications (protected)
- GET /api/notifications/telegram/link → {linked, deep_link?} one-time Telegram connect link (503 if bot not configured)

## Notifications (Telegram)
Provider-agnostic notification subsystem; Telegram is the primary (free) channel.
- `telegram/client.go` — minimal Bot API client (stdlib only): long-poll `getUpdates` + `sendMessage`.
- `services/notification_service.go` — two background goroutines started in main.go via `notifySvc.Start()`:
  dispatcher (every 60s delivers due `notifications` rows) + bot poller (handles `/start <code>` account linking).
- `notifications` table is a dispatch queue (extended in migration 000003 with appointment_id, scheduled_for, attempts).
- Booking flow: `AppointmentService.Create` → `EnqueueBooking` (client confirmation now + reminders at 24h and
  `settings.notify_reminder_hours` before; pro gets a new-booking ping). Cancellation skips pending rows.
- Disabled (no-op) when `TELEGRAM_BOT_TOKEN` is empty — dev default. Set `TELEGRAM_BOT_TOKEN` +
  `TELEGRAM_BOT_USERNAME` (from @BotFather) to enable. SMS channel is stubbed (marked skipped) for later.
- Frontend: checkout success screen shows a "Підключити Telegram" button (`getTelegramLink()` in lib/api.ts).

## Domain Model
- **Roles:** CLIENT | PROFESSIONAL (stored in users.role)
- **Phone is primary identifier** (stored in user_phones table, not users table)
- **Email is optional** (nullable on users table)

## Time Convention (fake-UTC)
All appointment/schedule times are the pro's **wall clock** (Europe/Kyiv) stored/sent with a `Z` label.
- Frontend: read components ONLY via getUTC* / format with `timeZone: "UTC"`; derive "now"/"today" via `lib/kyivtime.ts` (kyivToday/kyivNow), never from the browser clock.
- Backend: before comparing a stored time against real `time.Now()` (lead-time checks, reminder scheduling), convert via `utils.WallToReal` / `utils.LocationOrKyiv` (utils/timeutil.go).

## How to Run
```bash
# DB (if not running)
docker start zilobook-db
# Backend
cd backend && go run main.go
# Frontend
cd frontend && npm run dev
```

## Environment Variables (backend)
- DATABASE_URL (default: postgres://postgres:secret@localhost:5432/zilobook?sslmode=disable)
- JWT_SECRET (default: zilobook-dev-secret-change-in-prod)
- PORT (default: 8080)
- CORS_ORIGIN — comma-separated list of allowed origins
  (default: http://localhost:3000; prod example: https://nails.zilobook.com,https://fit.zilobook.com,https://app.zilobook.com)


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Antigravity Kit is an AI-powered design intelligence toolkit providing searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines. It works as a skill/workflow for AI coding assistants (Claude Code, Windsurf, Cursor, etc.).

## Search Command

```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n <max_results>]
```

**Domain search:**
- `product` - Product type recommendations (SaaS, e-commerce, portfolio)
- `style` - UI styles (glassmorphism, minimalism, brutalism) + AI prompts and CSS keywords
- `typography` - Font pairings with Google Fonts imports
- `color` - Color palettes by product type
- `landing` - Page structure and CTA strategies
- `chart` - Chart types and library recommendations
- `ux` - Best practices and anti-patterns

**Stack search:**
```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --stack <stack>
```
Available stacks: `html-tailwind` (default), `react`, `nextjs`, `astro`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`

## Architecture

```
src/ui-ux-pro-max/                # Source of Truth
├── data/                         # Canonical CSV databases
│   ├── products.csv, styles.csv, colors.csv, typography.csv, ...
│   └── stacks/                   # Stack-specific guidelines
├── scripts/
│   ├── search.py                 # CLI entry point
│   ├── core.py                   # BM25 + regex hybrid search engine
│   └── design_system.py          # Design system generation
└── templates/
    ├── base/                     # Base templates (skill-content.md, quick-reference.md)
    └── platforms/                # Platform configs (claude.json, cursor.json, ...)

cli/                              # CLI installer (uipro-cli on npm)
├── src/
│   ├── commands/init.ts          # Install command with template generation
│   └── utils/template.ts         # Template rendering engine
└── assets/                       # Bundled assets (~564KB)
    ├── data/                     # Copy of src/ui-ux-pro-max/data/
    ├── scripts/                  # Copy of src/ui-ux-pro-max/scripts/
    └── templates/                # Copy of src/ui-ux-pro-max/templates/

.claude/skills/ui-ux-pro-max/     # Claude Code skill (symlinks to src/)
.factory/skills/ui-ux-pro-max/   # Droid (Factory) skill (symlinks to src/)
.shared/ui-ux-pro-max/            # Symlink to src/ui-ux-pro-max/
.claude-plugin/                   # Claude Marketplace publishing
```

The search engine uses BM25 ranking combined with regex matching. Domain auto-detection is available when `--domain` is omitted.

## Sync Rules

**Source of Truth:** `src/ui-ux-pro-max/`

When modifying files:

1. **Data & Scripts** - Edit in `src/ui-ux-pro-max/`:
   - `data/*.csv` and `data/stacks/*.csv`
   - `scripts/*.py`
   - Changes automatically available via symlinks in `.claude/`, `.factory/`, `.shared/`

2. **Templates** - Edit in `src/ui-ux-pro-max/templates/`:
   - `base/skill-content.md` - Common SKILL.md content
   - `base/quick-reference.md` - Quick reference section (Claude only)
   - `platforms/*.json` - Platform-specific configs

3. **CLI Assets** - Run sync before publishing:
   ```bash
   cp -r src/ui-ux-pro-max/data/* cli/assets/data/
   cp -r src/ui-ux-pro-max/scripts/* cli/assets/scripts/
   cp -r src/ui-ux-pro-max/templates/* cli/assets/templates/
   ```

4. **Reference Folders** - No manual sync needed. The CLI generates these from templates during `uipro init`.

## Prerequisites

Python 3.x (no external dependencies required)

## Git Workflow

Never push directly to `main`. Always:

1. Create a new branch: `git checkout -b feat/...` or `fix/...`
2. Commit changes
3. Push branch: `git push -u origin <branch>`
4. Create PR: `gh pr create`


