# Zilobook - System Instructions for AI (Gemini)

This file contains the current state and guidelines for building the **Zilobook** scheduling platform. Please read this file whenever you are resumed in a new chat context.

## 1. Project Overview
Zilobook is a Next.js + Golang scheduling application targeting solopreneurs (manicurists first, then personal trainers and mechanics) in Ukraine. The core pitch is a premium, seamless "link in bio" scheduling app that prevents no-shows via reminders and automated deposits.

**Distribution model:** one deployment, several niche marketing domains (e.g. nails.zilobook.com, fit.zilobook.com). It is a SaaS tool for pros, NOT a marketplace — public discovery (`/explore`) is hidden behind `FEATURES.marketplace = false` until there is enough supply. Full release checklist lives in `REQUIREMENTS.md`.

## 2. Tech Stack
-   **Frontend**: Next.js (App Router), React, TailwindCSS v4, TypeScript.
-   **Backend**: Golang (Gin Framework).
-   **Database**: PostgreSQL (Migrations using SQL up/down files).

## 3. Core Architectural Principles
-   **Show, Don't Tell (PLG)**: Our UI must look incredibly sleek and immediately show the value proposition. The landing page has an interactive mock calendar to prove to users the app is better than their notebook.
-   **Unified Frontend via Theme State**: Do not build disconnected `page.tsx` directories for different niches. We use a unified dynamic `LandingClient.tsx` component that flips between `fitness`, `beauty`, and `service` styling variables on the fly.
-   **Domain-Driven Niches**: `frontend/src/lib/niches.ts` is the single source of truth for niche routing: domain → niche mapping (`getNicheFromHost`), per-niche SEO meta, default `locations.type`, and `FEATURES` flags. `app/page.tsx` resolves the niche server-side (`?theme=` override → Host header → default) and locks the theme switcher on niche domains. The booking page themes by `location.type`, not by domain. The dashboard is niche-neutral (single app domain). Next.js 16 note: `middleware.ts` is renamed `proxy.ts`; we read `headers()` in server components instead.
-   **Localization**: Per-niche SEO meta is already Ukrainian; the rest of the UI is English and will be localized systematically before release (see REQUIREMENTS.md).
-   **Payments**: Stripe does not work in Ukraine. Plan: a local PSP (WayForPay / LiqPay / Fondy / monobank acquiring) which provides Apple Pay & Google Pay out of the box. Two money flows: (1) pro's subscription 200 UAH/mo via recurring card token, (2) client prepayments/deposits to the pro to prevent no-shows.
-   **Anonymized Public Booking**: Client-facing calendars must NEVER expose internal names/phone numbers. Booked slots show strictly as generic grayed-out blocks.
-   **Professional Elasticity & Dual-Booking Conflict Rules**:
    - Professionals are loosely coupled by default—they are available globally across assignments.
    - Professionals use Settings to dictate specific day/time schedules locking them to particular Locations.
    - If a Professional receives two separate bookings overlapping in time across two *different* physical locations, that booking triggers a "Manual Confirmation Required" state by default.
    - The booking page must present a top-level multi-select horizontal scroll of Professionals. Selecting one filters availability to them, selecting multiple joins their availability tables visually.

## 4. Current State
-   `frontend/src/app/page.tsx` routes search params cleanly down to `LandingClient.tsx` rendering multiple themes.
-   **Authentication**: The Golang API successfully manages authentication. `POST /api/auth/register` and `login` are set up. Passwords use `bcrypt`, and it uses robust SQL migrations to orchestrate PostgreSQL locally (`zilobook-db` container).
-   **Frontend Registration**: The `/register` UI is fully operational. Phone numbers natively are strictly mandatory for both "Pro" and "Client" accounts, and the form directly requests the Go backend.
-   **Dashboard & Calendar Interfaces**:
    -   `/dashboard` features a vertical day-timeline scheduling layout.
    -   `/dashboard/calendar` contains a highly sophisticated multi-view engine (Month/Week/Day), dynamic theme switcher, and direct click-to-call links natively integrated (`tel:` rendering).
    -   `/dashboard/calendar/new` is a dedicated interface handling 1-on-1, Group, and Block slot scheduling.
    -   Interactions are completely immersive via the `BottomSheet.tsx` modal sliding element.

## 5. Next Focus Areas
If prompted to continue building, follow the release plan in `REQUIREMENTS.md`. Current priorities:
1.  Ukrainian localization of the landing pages and booking flow (per-niche copy).
2.  Booking-page theming by `location.type` (a nail master's link must look "beauty" on any domain).
3.  Notifications/reminders pipeline (Viber/Telegram/SMS) — the main anti-no-show feature.
4.  Payments via a local PSP (WayForPay/LiqPay/Fondy): pro subscription (recurring) + client prepayments, with Apple Pay & Google Pay provided by the PSP checkout.


# IMPORTANT
you are senior architech and you are writing code for production. You have 15 years of experience
be smart, if you see that design is not follow architecture - tell me about that or suggest better solution
if you find that button or link doesnt do anything - tell me about that
if you see any  like (Broken Access Control, SQL Injection, XSS, RCE, Security Misconfiguration, Input Validation, CSRF, data leakage) - tell me about this.