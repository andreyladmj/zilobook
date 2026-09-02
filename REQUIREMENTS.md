# REQUIREMENTS.md — Zilobook Release Plan

Road to first paid release in Ukraine. Niche order: **nails/beauty first**, then fitness trainers, then auto services.
Business model: free tier (calendar + booking link) → paid 200 UAH/mo (reminders, prepayments, analytics).
Status legend: `[x]` done · `[ ]` todo · `[~]` partially done.

---

## Phase 0 — Architecture foundation (done in code)

- [x] Multi-domain niche resolution: `frontend/src/lib/niches.ts` (domain → niche, SEO meta, feature flags)
- [x] `app/page.tsx` resolves niche server-side (`?theme=` override → Host header → default), per-niche `generateMetadata`
- [x] Theme switcher hidden on niche-locked domains (`lockTheme`)
- [x] Marketplace (`/explore`) hidden behind `FEATURES.marketplace = false`
- [x] Backend `CORS_ORIGIN` accepts comma-separated origins
- [x] Booking page (`/location/[id]`, `/book`, `/checkout`) themed by `location.type` (ThemeProvider persist=false + themeForLocationType)
- [ ] Registration pre-selects `location.type` from the niche domain the pro signed up on
- [ ] Replace placeholder domains in `niches.ts` with real purchased domains
- [ ] Dashboard moved/kept on a single neutral app domain (`app.<domain>`); niche domains only host landing + booking links

## Phase 1 — Product completeness (must-have for beta)

### 1.1 Booking core
- [ ] End-to-end happy path verified: register pro → create location + services → set working hours → client opens booking link → books → pro sees it in dashboard
- [x] Public booking link short URL `/b/[slug]` — resolves title_slug via GET /api/locations/slug/:slug and lands on the booking flow; works without login
- [ ] Anonymized public calendar (booked slots = generic blocks, no client names/phones) — already a stated principle, verify it holds
- [ ] Appointment statuses lifecycle (pending → confirmed → completed/cancelled/no-show) with `no-show` as an explicit status (feeds future analytics: "X UAH saved")
- [ ] Client cancellation/reschedule flow with a configurable cutoff (e.g. not later than 24h before)

### 1.2 Notifications & reminders (the feature people pay for)
- [x] Dispatch worker: Go goroutine + 60s ticker over the `notifications` queue (migration 000003)
- [x] Provider-agnostic notifier; Telegram primary (free). `TELEGRAM_BOT_TOKEN` empty = disabled no-op
- [x] Telegram bot MVP: long-poll `/start <code>` account linking; client confirmation + 24h/Nh reminders; pro new-booking ping
- [x] Cancellation skips pending reminders; checkout success shows "Підключити Telegram" connect button
- [ ] Create the real bot via @BotFather, set token + username in server .env, test end-to-end on prod
- [ ] SMS fallback via TurboSMS (channel is stubbed/skipped today) — add when paying users need it; can be a paid-tier feature
- [ ] Reminder timing fully configurable in settings UI (24h is currently fixed; short reminder uses notify_reminder_hours)

### 1.3 Payments
**Answer to "can we add Google Pay & Apple Pay?" — yes, and almost for free:**
Ukrainian PSPs (WayForPay, LiqPay/Privat, Fondy, monobank acquiring) all ship **Apple Pay and Google Pay out of the box** in their hosted checkout/widget. You integrate the PSP once — Apple Pay/Google Pay appear as payment methods automatically (Apple domain verification is a one-time DNS/file step the PSP guides you through). Do NOT integrate Apple/Google directly.

- [ ] Choose PSP (compare: WayForPay ~2.5%, Fondy, LiqPay; criteria: recurring/token payments + payouts to ФОП + Apple/Google Pay)
- [ ] Flow A — pro subscription (200 UAH/mo): card tokenization + recurring charge; webhook → extend `subscription_until`; grace period 3–5 days; annual plan (e.g. 2000 UAH/yr)
- [ ] Flow B — client prepayment/deposit: pro sets deposit % or fixed amount per service; checkout via PSP (with Apple/Google Pay); booking auto-confirms on successful payment webhook
- [ ] `payments` table + webhook endpoint with signature verification + idempotency
- [ ] Free tier limits enforced server-side (e.g. reminders & prepayments are paid-only)
- [ ] Stripe is NOT available in Ukraine — do not plan around it

### 1.4 Localization
- [x] Ukrainian UI for public pages: landing, location page, booking flow, checkout, login/register; `lang="uk"`, UA metadata
- [x] Demo calendar events in `LandingClient.tsx` localized per niche, 24h time format, ₴ in demo data
- [ ] Dashboard (pro cabinet) localization — still English
- [ ] Notifications/emails in Ukrainian (when notifications exist)
- [ ] Phone input mask +380, validation server-side

## Phase 2 — Content & visuals

- [ ] Logo + favicon + app icons (per-niche accent color is enough; one logo, three accents)
- [ ] OG-images per niche domain (1200×630) — generated (AI or Figma), shown when pros share their link in Telegram/Instagram — this is free marketing, make them beautiful
- [ ] Hero/landing imagery per niche (real-looking calendar screenshots > stock photos; current interactive calendar demo is the right idea — keep it, localize it)
- [ ] Per-niche landing copy (UA), pain-point led: «Клієнт не прийшов? Передоплата залишилась у вас», «Записи з Instagram без переписок»
- [ ] Pricing page: free vs 200 UAH/mo comparison table
- [ ] FAQ section per niche (booking, prepayment, cancellations, payouts)
- [ ] Onboarding screenshots/short video (loom-style) for the first 10 masters
- [ ] Legal pages: Публічна оферта, Політика конфіденційності (required by PSPs before they approve the merchant account!)

## Phase 3 — SEO

- [ ] Per-niche `generateMetadata` (done for `/`); extend to all public pages incl. booking pages (`title: "Запис до {master} — {service}"`)
- [ ] `sitemap.ts` + `robots.ts` per domain (Next.js App Router conventions)
- [ ] Structured data (JSON-LD): `SoftwareApplication` on landings; `LocalBusiness`/`BeautySalon` on public location pages
- [ ] hreflang/canonical: each niche domain canonicalizes its own content; no duplicate copy across domains (different copy per niche solves this naturally)
- [ ] `lang="uk"` on html tag for UA pages (currently `lang="en"` in layout.tsx)
- [ ] Core Web Vitals pass on mobile 4G (booking page is the critical path; budget: LCP < 2.5s)
- [ ] Analytics: Plausible/Umami (lightweight, GDPR-friendly) or GA4; track funnel: landing → register → first location → first booking link share → first booking
- [ ] Google Search Console + Bing for each domain

## Phase 4 — Testing

- [ ] Backend unit tests: auth (token rotation, expiry), availability calculation (overlaps, working hours edge cases, timezone Europe/Kyiv + DST), booking conflicts
- [ ] API integration tests against real Postgres (docker-compose test DB): full booking lifecycle, role guards (client can't create locations, non-owner can't edit)
- [ ] E2E (Playwright): register → create service → book as client → see appointment; run against staging
- [ ] Payment webhook tests: signature check, replay/idempotency, failed payment paths
- [ ] Security checklist: bcrypt (done), SQL params everywhere (raw SQL — audit!), JWT_SECRET non-default enforced in prod, rate limiting on auth endpoints, no client PII on public calendars, IDOR checks on /appointments/:id
- [ ] Mobile manual pass: booking flow on cheap Android + iPhone Safari (Apple Pay only shows in Safari!)
- [ ] Load sanity: booking link page at ~100 RPS (it's the only page that gets traffic spikes)

## Phase 5 — Infrastructure & deploy

- [x] **Deployed**: Hetzner VPS (Ubuntu 24.04) + Docker Compose (Caddy auto-TLS → Next.js + Go API → Postgres 17), see `deploy/README.md`
- [x] Domains: zilobook.com bought (Cloudflare Registrar); `@`, `www`, `nails`, `app` live behind Cloudflare proxy, SSL Full (strict), Always Use HTTPS
- [~] Postgres backups: daily 03:30 via `/etc/cron.d/zilobook-backup` on the server (verified 2026-09-02, dumps in /opt/zilobook/backups); off-server upload + restore test still TODO
- [x] CI/CD: `.github/workflows/deploy.yml` deploys main → prod (secrets set, verified working); no test step before deploy yet
- [x] Secrets: real JWT_SECRET + DB password in server-side .env; backend refuses default JWT_SECRET when GIN_MODE=release
- [ ] Monitoring: Sentry (frontend + Go), uptime check on booking link route (Betterstack/UptimeRobot), structured logs
- [ ] Error pages, 404, maintenance page

## Phase 6 — Beta & launch

- [ ] Private beta: 5–10 nail masters (personal network/Instagram outreach), free forever as founding users — in exchange for weekly feedback
- [ ] Success metric for beta: ≥50% of masters still actively using the booking link after 4 weeks
- [ ] Onboarding concierge: set up their profile/services for them in a 20-min call
- [ ] Iterate 2–4 weeks on beta feedback BEFORE enabling payments
- [ ] Enable subscription billing; founding users keep free
- [ ] Launch channels: Instagram targeting (UA, інтереси: манікюр/б'юті-майстри), nail schools partnership, Telegram communities of masters
- [ ] Referral loop: "Створено в Zilobook" footer on every public booking page (already the plan — verify it links to the right niche domain)
- [ ] Marketplace (`/explore`): re-enable `FEATURES.marketplace` only after ~200+ active pros in one city

---

## When to deploy? (answer: much earlier than feels natural)

1. **Staging — this week.** Deploy current state to a VPS with a real domain and HTTPS immediately. Reasons: payment provider onboarding requires a live site with offer/privacy pages; Apple Pay requires domain verification; real-device testing needs HTTPS; you'll find deploy/env bugs now, not at launch.
2. **Production "soft" — at Phase 1.1 done** (booking happy path works): give the link to the first 2–3 friendly masters. No payments yet, everything free.
3. **Public launch — after beta iteration + payments (Phases 1–4 complete).**

Deploy is not the last step; it's infrastructure for testing and PSP onboarding. Ship staging first, keep `main` always deployable.

## Out of scope for v1 (explicitly deferred)
- Marketplace/discovery, reviews, waitlist UI (schema exists — fine)
- Native mobile apps (PWA/web is enough; clients book via link)
- Multi-staff salons (solo masters first; staff features exist but are not marketed)
- Other countries/currencies, English UI
