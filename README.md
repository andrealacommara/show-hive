# ShowHive — Shift Management Platform

> A modern, invite-only web application for scheduling and managing work shifts, built with Next.js, Supabase, and Google Calendar integration.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Install dependencies](#2-install-dependencies)
  - [3. Set up Supabase](#3-set-up-supabase)
  - [4. Set up Google Calendar integration](#4-set-up-google-calendar-integration)
  - [5. Configure environment variables](#5-configure-environment-variables)
  - [6. Run the development server](#6-run-the-development-server)
- [Environment Variables](#environment-variables)
- [Google Calendar Setup](#google-calendar-setup)
- [Authentication & Authorization](#authentication--authorization)
- [API Reference](#api-reference)
- [Roles & Permissions](#roles--permissions)
- [Demo Mode](#demo-mode)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

**ShowHive** (`show-hive-gestionale`) is a closed-access shift management tool designed for small teams — such as event staff, venue crews, or production teams. It allows administrators to create shifts at specific venues, assign team members, and automatically sync events to a centralized Google Calendar. Members can declare their unavailability so that the system prevents accidental scheduling conflicts.

Authentication is handled exclusively via Google OAuth. Access to the application is controlled by a whitelist (`allowed_users` table), so only pre-approved email addresses can log in.

---

## Features

- **Google OAuth login** — passwordless sign-in; only whitelisted emails can access the app.
- **Shift management** — create, edit, and delete shifts with title, description, date, start/end time, and venue.
- **Multi-assignee support** — assign multiple team members to a single shift.
- **Venue management** — maintain a list of venues (name, address, city) used across shifts.
- **Unavailability tracking** — members can mark date ranges when they are unavailable; the system blocks scheduling them on those days.
- **Google Calendar sync** — shifts are automatically created as events on a centralized Google Calendar, with email invitations sent to all assignees. Edits and deletions are synced in real time.
- **Calendar view** — interactive monthly grid showing shifts and unavailabilities.
- **Table view** — spreadsheet-style alternative view for shifts.
- **Role-based access control** — two roles (`admin` and `member`) with fine-grained Supabase RLS policies.
- **Demo mode** — a fully interactive preview of the app with realistic mock data, accessible from the login page without any account. No database writes are performed; all mutation attempts show an informational toast.
- **Dark/light theme** — powered by `next-themes`.
- **Responsive design** — works on desktop and mobile.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + Radix UI primitives |
| Icons | [Lucide React](https://lucide.dev/) |
| Forms | React Hook Form + Zod |
| Backend / DB | [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS) |
| Calendar sync | [Google Calendar API](https://developers.google.com/calendar) via `googleapis` |
| Date utilities | `date-fns` + `react-day-picker` |
| Analytics | Vercel Analytics |
| Package manager | [pnpm](https://pnpm.io/) |

---

## Architecture

```
Browser
  │
  ▼
Next.js App Router (server components + client components)
  │
  ├── /app/auth/*          ← OAuth callback, login page, unauthorized page
  ├── /app/dashboard/*     ← Main application page (server-rendered)
  ├── /app/setup/*         ← Google Calendar configuration guide
  └── /app/api/*           ← REST API routes (Next.js Route Handlers)
        ├── /shifts          ← CRUD + Google Calendar sync
        ├── /venues          ← CRUD
        ├── /members         ← Allowed users management
        ├── /unavailabilities← Unavailability periods
        └── /profile         ← User profile update

Supabase (PostgreSQL)
  ├── auth.users           ← Managed by Supabase Auth
  ├── public.profiles      ← User profile data (synced via trigger)
  ├── public.allowed_users ← Whitelist with roles
  ├── public.venues        ← Venue catalog
  ├── public.shifts        ← Shift records
  ├── public.shift_assignees ← Many-to-many: shifts ↔ users
  └── public.unavailabilities ← Unavailability date ranges

Google Calendar API
  └── Central calendar (`ADMIN_GOOGLE_CALENDAR_ID`)
        ← Events created/updated/deleted server-side
        ← Invites sent to assignees via sendUpdates: "all"
```

The application runs entirely server-side for data fetching (dashboard page uses async Server Components). Mutations go through Next.js API Route Handlers, which authenticate the caller, enforce authorization, update the database, and — where applicable — sync with Google Calendar.

---

## Database Schema

### `profiles`
Automatically populated when a user first signs in (via a PostgreSQL trigger on `auth.users`).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | FK → `auth.users.id` |
| `email` | `text` | |
| `full_name` | `text` | From Google OAuth metadata |
| `avatar_url` | `text` | From Google OAuth metadata |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### `allowed_users`
Whitelist of users permitted to access the app, with their role.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `email` | `text` | Unique |
| `role` | `text` | `'admin'` or `'member'` |
| `created_by` | `uuid` | FK → `auth.users.id` |
| `created_at` | `timestamptz` | |

A database trigger (`ensure_admin_exists_trigger`) prevents the last admin from being removed or downgraded.

### `venues`
Locations where shifts can take place.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | |
| `address` | `text` | |
| `city` | `text` | |
| `created_by` | `uuid` | FK → `auth.users.id` |
| `created_at` / `updated_at` | `timestamptz` | |

### `shifts`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `venue_id` | `uuid` | FK → `venues.id` (cascade delete) |
| `assigned_to` | `uuid` | FK → `profiles.id` (legacy single-assignee, set null on delete) |
| `title` | `text` | |
| `description` | `text` | |
| `shift_date` | `date` | |
| `start_time` | `time` | |
| `end_time` | `time` | |
| `google_calendar_event_id` | `text` | Stored after calendar sync |
| `created_by` | `uuid` | FK → `auth.users.id` |
| `created_at` / `updated_at` | `timestamptz` | |

### `shift_assignees`
Junction table for multi-assignee support.

| Column | Type | Notes |
|---|---|---|
| `shift_id` | `uuid` | FK → `shifts.id` (cascade) |
| `user_id` | `uuid` | FK → `profiles.id` (cascade) |
| `created_at` | `timestamptz` | |

Primary key: `(shift_id, user_id)`.

### `unavailabilities`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` (cascade) |
| `start_date` | `date` | |
| `end_date` | `date` | |
| `reason` | `text` | Optional |
| `created_at` / `updated_at` | `timestamptz` | |

---

## Project Structure

```
show-hive/
├── app/
│   ├── api/
│   │   ├── members/          # GET (list), POST (add); [id]/ PATCH, DELETE
│   │   ├── profile/          # PUT (update own profile)
│   │   ├── shifts/           # POST (create); [id]/ PUT, DELETE
│   │   │   └── [id]/assignees/ # GET (fetch assignee list)
│   │   ├── unavailabilities/ # GET, POST; [id]/ PUT, DELETE
│   │   └── venues/           # POST; [id]/ PUT, DELETE
│   ├── auth/
│   │   ├── callback/         # OAuth redirect handler
│   │   ├── login/            # Login page
│   │   └── unauthorized/     # Access denied page
│   ├── dashboard/            # Main dashboard (server component)
│   ├── setup/                # Google Calendar setup guide
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Root redirect → /dashboard
├── components/
│   ├── dashboard/
│   │   ├── dashboard-header.tsx
│   │   ├── dashboard-view.tsx
│   │   ├── shifts-calendar.tsx
│   │   ├── shifts-list.tsx
│   │   ├── shifts-table-view.tsx
│   │   ├── venues-list.tsx
│   │   ├── members-card.tsx
│   │   ├── create-shift-dialog.tsx
│   │   ├── edit-shift-dialog.tsx
│   │   ├── create-venue-dialog.tsx
│   │   ├── edit-venue-dialog.tsx
│   │   ├── edit-profile-dialog.tsx
│   │   └── mark-unavailable-dialog.tsx
│   ├── ui/                   # shadcn/ui component library
│   └── theme-provider.tsx
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   ├── authz.ts              # Authorization helpers (requireAllowed, requireAdmin)
│   ├── demo-data.ts          # Mock data for demo mode (shifts, venues, members, unavailabilities)
│   ├── google.ts             # Google API client factory
│   ├── google-calendar.ts    # Calendar CRUD helpers
│   ├── supabase/
│   │   ├── admin.ts          # Supabase service-role client (bypasses RLS)
│   │   ├── client.ts         # Browser client
│   │   ├── middleware.ts     # Session refresh middleware
│   │   └── server.ts         # Server-side client
│   └── utils.ts              # cn() and other utilities
├── types/
│   └── index.ts              # TypeScript type definitions
├── scripts/
│   ├── 001_create_tables.sql
│   ├── 002_profile_trigger.sql
│   └── 003_allowed_users.sql
├── styles/
│   └── globals.css
├── proxy.ts                  # Next.js proxy entry point
├── next.config.mjs
├── tsconfig.json
├── components.json           # shadcn/ui config
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.9.0
- **[pnpm](https://pnpm.io/)** (recommended) or npm
- A [Supabase](https://supabase.com/) project
- A [Google Cloud](https://console.cloud.google.com/) project with the **Google Calendar API** enabled and OAuth credentials configured

---

### 1. Clone the repository

```bash
git clone <repository-url>
cd show-hive
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, run the migration scripts **in order**:

```sql
-- Run each file in sequence:
scripts/001_create_tables.sql
scripts/002_profile_trigger.sql
scripts/003_allowed_users.sql
```

3. In your Supabase project, go to **Authentication → Providers → Google** and enable Google OAuth. You will need a Google OAuth Client ID and Secret (see next section).

4. Set the redirect URL in Supabase Auth to:
   ```
   https://<your-domain>/auth/callback
   ```

5. Copy your **Project URL** and **anon key** from **Settings → API**.

---

### 4. Set up Google Calendar integration

See the in-app guide at `/setup`, or follow these steps:

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web application). Add your domain (and `http://localhost:3000` for local development) to the authorized origins/redirect URIs.
3. Enable the **Google Calendar API** under Library.
4. Use [Google OAuth Playground](https://developers.google.com/oauthplayground) to obtain a **refresh token** for the central admin Google account (for example the shared calendar owner, or your own admin email):
   - In the playground settings, check **"Use your own OAuth credentials"** and enter your Client ID and Secret.
   - Authorize the scope `https://www.googleapis.com/auth/calendar`.
   - Exchange the authorization code and copy the `refresh_token`.

---

### 5. Configure environment variables

Create a `.env.local` file at the root of the project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Google OAuth (for user login — configured in Supabase Auth)
# These are entered directly in the Supabase dashboard, not here.

# Google Calendar (server-side only — for the central calendar account)
ADMIN_GOOGLE_CLIENT_ID=<your-oauth-client-id>
ADMIN_GOOGLE_CLIENT_SECRET=<your-oauth-client-secret>
ADMIN_GOOGLE_REFRESH_TOKEN=<refresh-token-for-admin-account>
ADMIN_GOOGLE_CALENDAR_ID=<calendar-id-or-email>
NEXT_PUBLIC_ADMIN_GOOGLE_CALENDAR_ID=<same-calendar-id-for-setup-page>
```

> ⚠️ **Security note:** Never commit `.env` or `.env.local` to version control. The `SUPABASE_SERVICE_ROLE_KEY` and Google credentials are sensitive and must be kept server-side only.

---

### 6. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the login page.

**First-time bootstrap:** seed the first `allowed_users` row manually in Supabase with role `admin` before trying to use the dashboard. The database policy allows bootstrapping the first admin, but the current app flow redirects non-whitelisted users to `/auth/unauthorized`, so the initial insert is not exposed via UI.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server only) |
| `ADMIN_GOOGLE_CLIENT_ID` | ✅ | OAuth 2.0 Client ID for Google Calendar |
| `ADMIN_GOOGLE_CLIENT_SECRET` | ✅ | OAuth 2.0 Client Secret |
| `ADMIN_GOOGLE_REFRESH_TOKEN` | ✅ | Refresh token for the central calendar account |
| `ADMIN_GOOGLE_CALENDAR_ID` | ✅ | Google Calendar ID or calendar owner email used for event sync |
| `NEXT_PUBLIC_ADMIN_GOOGLE_CALENDAR_ID` | Optional | Calendar ID shown in the `/setup` page only |

---

## Google Calendar Setup

ShowHive uses a **server-side, single-account** approach for Google Calendar. All calendar events are created on one central Google account (the "admin" account). This means:

- No per-user OAuth consent is required.
- The server authenticates as the admin account using a long-lived refresh token.
- When a shift is created or updated with assignees, an event is inserted on the central calendar and email invitations are sent to all assignees automatically.
- When a shift is deleted or its assignees are changed, the corresponding calendar event is deleted or updated.

The central calendar is selected through `ADMIN_GOOGLE_CALENDAR_ID` in [lib/google-calendar.ts](/Users/lacco/Downloads/show-hive/lib/google-calendar.ts).

---

## Authentication & Authorization

### Authentication flow

1. User visits the app → redirected to `/auth/login`.
2. User clicks **Sign in with Google** → Supabase initiates Google OAuth.
3. After consent, Google redirects to `/auth/callback`.
4. Supabase exchanges the code for a session; the `handle_new_user` trigger auto-creates a `profiles` record.
5. The dashboard page checks `allowed_users` for the user's email. If not found → redirect to `/auth/unauthorized`.

### Authorization helpers (`lib/authz.ts`)

| Function | Behavior |
|---|---|
| `getUserAccess(email)` | Returns the `allowed_users` row for the email, or `null`. |
| `requireAllowed(email)` | Throws `"Unauthorized"` if the user is not in `allowed_users`. |
| `requireAdmin(email)` | Throws `"Forbidden"` if the user's role is not `'admin'`. |

The main protected route handlers use `requireAllowed` and `requireAdmin` to enforce whitelist and role checks. A few endpoints also rely on authenticated ownership checks directly in the handler and/or RLS.

---

## API Reference

All endpoints are under `/app/api/` and follow Next.js Route Handler conventions. They require the caller to have an active Supabase session (cookie-based).

### Shifts — `/api/shifts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/shifts` | Member | Create a shift; triggers Google Calendar event |
| `PUT` | `/api/shifts/[id]` | Member (creator, assignee, or admin) | Update shift; syncs calendar event |
| `DELETE` | `/api/shifts/[id]` | Member (creator, assignee, or admin) | Delete shift; removes calendar event |
| `GET` | `/api/shifts/[id]/assignees` | Member | Return the assignee list for one shift |

**POST/PUT body fields:**

```json
{
  "title": "string",
  "description": "string (optional)",
  "venue_id": "uuid",
  "shift_date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "assignees": ["uuid", "uuid"]
}
```

The API checks unavailability for all assignees and returns `400` if any assignee is unavailable on the shift date.

### Venues — `/api/venues`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/venues` | Member | Create a venue |
| `PUT` | `/api/venues/[id]` | Admin | Update a venue |
| `DELETE` | `/api/venues/[id]` | Admin | Delete a venue |

### Members — `/api/members`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/members` | Admin | List all allowed users |
| `POST` | `/api/members` | Admin | Add a new allowed user |
| `PATCH` | `/api/members/[id]` | Admin | Update role |
| `DELETE` | `/api/members/[id]` | Admin | Remove a user from the whitelist |

### Unavailabilities — `/api/unavailabilities`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/unavailabilities` | Member | List all unavailability periods |
| `POST` | `/api/unavailabilities` | Member | Declare own unavailability |
| `PUT` | `/api/unavailabilities/[id]` | Owner | Update own period |
| `DELETE` | `/api/unavailabilities/[id]` | Owner | Remove own period |

### Profile — `/api/profile`

| Method | Path | Auth | Description |
|---|---|---|---|
| `PUT` | `/api/profile` | Self | Update `profiles.full_name` from `first_name` and `last_name` |

---

## Roles & Permissions

| Action | `member` | `admin` |
|---|---|---|
| View dashboard | ✅ | ✅ |
| Create shifts | ✅ | ✅ |
| Edit/delete own shifts | ✅ | ✅ |
| Edit/delete assigned shifts | ✅ | ✅ |
| Edit/delete any shift | ❌ | ✅ |
| Create venues | ✅ | ✅ |
| Edit/delete venues | ❌ | ✅ |
| Manage unavailabilities (own) | ✅ | ✅ |
| View all unavailabilities | ✅ | ✅ |
| View members list | ❌ | ✅ |
| Add/remove members | ❌ | ✅ |
| Change member roles | ❌ | ✅ |

Permissions are enforced both at the API layer (via `requireAdmin` / `requireAllowed`) and at the database layer via Supabase Row Level Security policies. Note that some reads in the dashboard are done server-side with the service-role client rather than through public `GET /api/*` endpoints.

---

## Demo Mode

ShowHive includes a fully interactive demo mode that lets anyone explore the application without a Google account or database access. It is designed for sharing with stakeholders, recruiters, or anyone who needs to evaluate the app without being added to the whitelist.

### How it works

Clicking **"Prova la demo"** on the login page navigates to `/dashboard?demo=true`. The Next.js proxy detects the `demo=true` query parameter and skips the authentication redirect, allowing the request through without a Supabase session. The dashboard Server Component then detects the flag and renders the `DashboardView` with hardcoded mock data instead of fetching from the database.

All mutation buttons (create/edit shifts, create/edit venues, add/remove members, mark unavailability) remain visible and interactive, but intercept the action before any API call and display a Sonner toast: *"Modalità demo — Le modifiche non vengono salvate in demo."*

A sticky amber banner at the top of the page reminds the user they are in demo mode, with a direct link back to the login page.

### Files involved

| File | Role |
|---|---|
| `lib/demo-data.ts` | Hardcoded mock data — 4 venues, 10 shifts spread across upcoming dates, 4 team members, 3 unavailability periods |
| `lib/supabase/middleware.ts` | Skips auth redirect when `?demo=true` is present in the URL |
| `app/dashboard/page.tsx` | Branches on `searchParams.demo`; serves mock data instead of Supabase queries |
| `components/dashboard/dashboard-view.tsx` | Accepts `isDemo` prop; renders the sticky demo banner |
| `components/dashboard/dashboard-header.tsx` | "Esci" in demo mode redirects to login without calling `supabase.auth.signOut()` |
| `components/dashboard/shifts-list.tsx` | All action buttons show a toast instead of opening dialogs |
| `components/dashboard/venues-list.tsx` | Same |
| `components/dashboard/create-venue-dialog.tsx` | `handleSubmit` exits early with toast if `isDemo` |
| `components/dashboard/edit-venue-dialog.tsx` | Same |
| `components/dashboard/members-card.tsx` | All three handlers (add, delete, role change) intercept with toast |

### Security

Demo mode is entirely read-only at the data layer. It does not authenticate with Supabase, does not hold a session cookie, and never calls any `/api/*` route. The mock data in `lib/demo-data.ts` is static and fictional — no real user, venue, or shift data is exposed.

---

## Deployment

The application is designed to deploy on **Vercel** (the `@vercel/analytics` package is included):

1. Push the repository to GitHub/GitLab.
2. Import the project into Vercel.
3. Add all environment variables from the [Environment Variables](#environment-variables) section in the Vercel project settings.
4. Set the **Supabase redirect URL** to your Vercel production domain:
   ```
   https://<your-app>.vercel.app/auth/callback
   ```
5. Deploy. Vercel will run `pnpm build` automatically.

For other platforms, ensure the following:
- Node.js ≥ 20.9.0 runtime.
- All environment variables are set on the server (never exposed to the client).
- The server can reach `supabase.co` and `googleapis.com`.

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/your-feature`.
2. Make your changes and ensure TypeScript compiles: `pnpm build`.
3. Lint your code: `pnpm lint` after adding an ESLint config for the repo, or use your preferred validation flow if linting is not yet configured.
4. Open a pull request with a clear description of the changes.

> Note: `next.config.mjs` currently has `typescript.ignoreBuildErrors: true`. It is recommended to fix any TypeScript errors rather than relying on this flag in production.
