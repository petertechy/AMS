# Asset Management System (AMS) — MVP

A centralised Asset Management System built with Next.js (App Router), TypeScript, Tailwind CSS,
and Postgres (designed for [Neon](https://neon.tech)'s serverless Postgres).

Core scope: account management, asset list & visibility, and asset allocation (including
reassignment requests) — plus admin tools for managing accounts, sending real password-reset
emails, and switching whole features on/off.

## Requirements

- Node.js 20+
- A Postgres database — this project is built and tested against [Neon](https://neon.tech),
  which has a genuinely free tier (no credit card, no trial expiry) and works well with
  serverless hosts like Vercel.
- (Optional but recommended) A [Postmark](https://postmarkapp.com) account for real password-reset
  emails. Without it, reset links are shown on-screen instead — fine for local development.

## Getting started (local development)

```bash
npm install
cp .env.example .env      # then edit .env — see below
npm run seed               # creates/updates tables and demo data in your database
npm run dev                 # starts the app at http://localhost:3000
```

`npm run seed` is safe to re-run any time, including against a database that already has data
— it only creates tables that don't exist yet and only inserts demo users if the `users` table
is empty. Re-run it whenever you pull an update that adds a new table.

### Setting up `.env`

1. Create a free account at [neon.tech](https://neon.tech) and create a project.
2. From the project dashboard, copy the **pooled** connection string (the one with
   `-pooler` in the hostname) and set it as `DATABASE_URL`.
3. Set `SESSION_SECRET` to any long random string (e.g. `openssl rand -hex 32`).
4. Optionally set `ORG_EMAIL_DOMAINS` to restrict sign-up to your organisation's email
   domain(s), e.g. `acme.org,acme.co.uk`. Leave unset to allow any email domain.
5. For real password-reset emails: create a free account at
   [postmarkapp.com](https://postmarkapp.com), verify a **Sender Signature** (a single email
   address, confirmed via a link Postmark emails you — no DNS/domain needed), then create a
   Server and copy its **Server API Token** (Servers → your server → API Tokens) and set
   `POSTMARK_API_TOKEN`. Set `POSTMARK_FROM_EMAIL` to that verified sender address. Set
   `APP_URL` to your deployed URL (or leave as `http://localhost:3000` for local dev) so reset
   links in emails point to the right place. For higher-volume production sending later, verify
   a full domain in Postmark instead of a single sender signature — same env vars, no code
   changes needed.

## Demo accounts (created by `npm run seed`)

All demo accounts use the password `Password123!`.

| Role  | Email              | Notes                                   |
|-------|--------------------|------------------------------------------|
| Admin | admin@acme.org     | Full access: manage assets, allocations, approve requests, accounts, settings |
| Staff | sam@acme.org       | Has a laptop and phone allocated         |
| Staff | priya@acme.org     | Has a pending reassignment request       |

## Deploying (Vercel + Neon)

This app deploys as a single Next.js project — there's no separate backend service to run.

1. **Database**: create a Neon project (if you haven't already) and copy its pooled
   connection string.
2. **Push to GitHub**: commit this project to a GitHub repo.
3. **Import into Vercel**: at [vercel.com/new](https://vercel.com/new), import the repo.
   Vercel auto-detects Next.js — no build configuration needed.
4. **Environment variables**: in the Vercel project's Settings → Environment Variables, add
   `DATABASE_URL`, `SESSION_SECRET`, `ORG_EMAIL_DOMAINS` (optional), `POSTMARK_API_TOKEN`
   (optional), `POSTMARK_FROM_EMAIL` (optional), and `APP_URL` (set to your production URL once
   you know it).
5. **Deploy**. Vercel builds and deploys automatically on every push to your main branch.
6. **Seed the production database** once, from your own machine, by running
   `DATABASE_URL="<your Neon connection string>" node --env-file=.env scripts/seed.mjs`
   (or just point your local `.env` at production temporarily and run `npm run seed`).

Vercel's free Hobby tier and Neon's free tier are both genuinely free (not just a trial) and
comfortably cover an internal tool's traffic. You only pay if you outgrow them.

## What's included

**Account Management**
- Sign-up restricted to your organisation's email domain(s) (configurable), can be switched
  off entirely from Settings so only admins create new accounts
- Sign-in / sign-out, with a show/hide toggle on password fields
- Password reset — emailed via Postmark if configured, otherwise shown on-screen

**Asset List & Visibility**
- Browse all registered assets, filter by department, category, condition, location, status,
  plus free-text search
- Full specifications and current ownership on each asset's detail page
- Condition updates — allowed for administrators, or the staff member currently holding the asset

**Asset Allocation**
- "My Allocations" page: current assignments plus full history
- Admins allocate available assets to staff and mark assets returned
- Staff submit reassignment requests with a reason; admins approve/reject them (this whole
  feature can be switched off from Settings)

**Admin tools**
- **Manage Accounts** (`/admin/accounts`) — create new accounts directly (useful when public
  sign-up is switched off), change a user's role or department, and send password-reset links
  on demand
- **Settings** (`/admin/settings`) — toggle whole features on/off app-wide: reassignment
  requests, public sign-up, maintenance tracking, self-service check-in/check-out, and asset
  value/cost tracking

**Beyond the MVP** — built on top of the mandate's three core features, each toggleable from
Settings unless noted:
- **Departments** (`/admin/departments`) — a managed registry; asset and account forms use a
  dropdown sourced from it instead of free text
- **Audit Logs** (`/admin/audit-logs`, always on) — a running record of asset, allocation, and
  account changes across the organisation
- **Notifications** — a bell in the top bar for reassignment requests, resolutions, and
  allocations, always on
- **Maintenance Requests** (`/maintenance` for staff, `/admin/maintenance` for admins) — a full
  self-service ticketing workflow for reporting and tracking asset repairs, with attachments,
  discussion threads, and email notifications. See [docs/MAINTENANCE_REQUESTS.md](docs/MAINTENANCE_REQUESTS.md).
- **Check-in/Check-out** (`/checkout`) — lets staff instantly self-serve check an available asset
  out to themselves and back in, no admin approval needed

## Roles

- **ADMIN** — full access to asset registration/editing, allocation, request approval, account
  management, and settings.
- **STAFF** — can view all assets, manage their own allocations and condition updates, and
  submit reassignment requests (if enabled).

An admin can't demote their own account below ADMIN, to avoid accidentally locking everyone out.

## Architecture notes

- **One deployable, not two** — frontend and backend live in the same Next.js app. Server
  Actions (`src/app/actions/*.ts`) are the backend: they run only on the server and are called
  directly from forms, no separate REST API or hosting needed.
- **`src/lib/db.ts`** — Postgres connection pool + schema setup.
- **`src/lib/models.ts`** — all data access (assets, users, allocations, requests, settings).
- **`src/lib/features.ts`** — the feature-flag registry used by the Settings page and by every
  page/action that needs to check whether a feature is currently switched on.
- **`src/lib/email.ts`** — Postmark integration (plain REST call, no SDK dependency); degrades
  gracefully to an on-screen link if `POSTMARK_API_TOKEN`/`POSTMARK_FROM_EMAIL` aren't set.
- **Sessions** are signed JWTs stored in an httpOnly cookie — no session store needed.
- **Layout** — a persistent left sidebar (`src/components/Sidebar.tsx`) with role-aware nav
  items, collapsible on mobile via a pure-CSS checkbox toggle (no client JS needed for it to work).

## Suggested next steps

- Audit log export (the log itself now exists — this would add CSV/date-range export)
- File attachments for asset photos or invoices
- Bulk import of existing spreadsheet data
- Finer-grained per-role permissions (beyond the current ADMIN/STAFF split)
