# Internal Workspace Project Manager

A secure, multi-user project management web app for internal team collaboration built with **Next.js 16 App Router**, **TypeScript**, **Supabase**, and **Google Drive API**.

## Features

- **Workspace Management** — Create, rename, and switch between workspaces
- **Team Collaboration** — Invite members, assign roles (owner/manager/member)
- **Task Management** — Create, assign, track, and complete tasks with activity logging
- **Notes & Comments** — Threaded comments on tasks
- **Notifications** — In-app notifications for task assignments, completions, invites
- **Storyboard Folders** — Organize content in nested folder structures
- **File Management** — Upload and manage files via Google Drive backend
- **Admin Portal** — Platform oversight with user/workspace management and audit logs
- **Security** — JWT auth, workspace-scoped RLS, server-side permission checks

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 App Router + TypeScript |
| Auth | Supabase Auth (email/password) |
| Database | Supabase Postgres + RLS |
| File Storage | Google Drive API v3 |
| Validation | Zod v4 |
| Hosting | Vercel |

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Supabase project** (free tier works)
- **Google Drive API credentials** (OAuth2 client + refresh token)

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd project-management-app
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in all values in .env.local

# 3. Set up database
# Run db/migrations/001_initial_schema.sql in Supabase SQL Editor
# Run db/policies/rls_policies.sql in Supabase SQL Editor
# Optionally run db/seeds/seed.sql

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000
```

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) |
| `GOOGLE_DRIVE_CLIENT_ID` | ✅ | Google OAuth2 client ID |
| `GOOGLE_DRIVE_CLIENT_SECRET` | ✅ | Google OAuth2 client secret |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | ✅ | Pre-obtained OAuth2 refresh token |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | ✅ | Root folder ID in Google Drive |

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run unit + integration tests |
| `npm run test:e2e` | Run E2E smoke tests |

## Database Setup

1. Create a new Supabase project
2. Go to SQL Editor
3. Run `db/migrations/001_initial_schema.sql`
4. Run `db/policies/rls_policies.sql`
5. (Optional) Run `db/seeds/seed.sql` — update placeholder UUIDs first

## Google Drive Setup

1. Create a Google Cloud project
2. Enable Google Drive API
3. Create OAuth2 credentials (Desktop app type)
4. Obtain a refresh token using the OAuth2 flow
5. Create a root folder in Google Drive
6. Copy the folder ID to `GOOGLE_DRIVE_ROOT_FOLDER_ID`

See [docs/google-drive-integration.md](docs/google-drive-integration.md) for detailed instructions.

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add all env vars from `.env.example`
4. Deploy

See [docs/deployment-runbook.md](docs/deployment-runbook.md) for the full checklist.

## Docker

```bash
# Build and run
docker-compose up --build

# Or standalone
docker build -t iwpm .
docker run -p 3000:3000 --env-file .env.local iwpm
```

## Project Structure

```
app/              # Next.js App Router pages and API routes
  (auth)/         # Public auth pages (login, forgot-password)
  (app)/          # Protected app pages (dashboard, workspace, etc.)
  admin/          # Admin portal pages
  api/            # API route handlers
components/       # React components organized by feature
lib/              # Shared libraries and utilities
  auth/           # Auth helpers
  permissions/    # RBAC and access control
  supabase/       # Supabase clients
  google-drive/   # Google Drive service layer
  notifications/  # Notification creation
  validators/     # Zod validation schemas
  utils/          # Utility functions
  admin/          # Admin audit logging
db/               # Database files
  migrations/     # SQL schema migrations
  policies/       # RLS policies
  seeds/          # Seed data
tests/            # Test suites
docs/             # Documentation
```

## License

Internal use only — not licensed for external distribution.
