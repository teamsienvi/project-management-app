# Architecture

## System Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│  Next.js     │────▶│  Supabase    │
│   (React)    │◀────│  App Router  │◀────│  Postgres    │
└──────────────┘     │  + API       │     └──────────────┘
                     │  Routes      │     ┌──────────────┐
                     │              │────▶│  Google      │
                     └──────────────┘     │  Drive API   │
                                          └──────────────┘
```

## Auth Flow
1. User submits email/password on `/login`
2. Supabase Auth issues JWT + refresh token
3. Next.js middleware refreshes session on every request
4. Protected pages call `requireAuth()` server-side
5. API routes verify JWT via `supabase.auth.getUser()`

## RBAC Model
- **Global**: `user` (default), `admin` (via `profiles.is_admin`)
- **Workspace**: `owner`, `manager`, `member` (via `workspace_members.role`)
- All workspace-scoped operations check membership via `requireWorkspaceMembership()`
- Role escalation prevented by Zod schemas (can only assign `manager`/`member`)

## RLS Strategy
- Every table has RLS enabled
- `is_workspace_member()` helper function for consistent access checks
- Profiles: self-access only
- Workspace data: scoped to members
- Notifications: scoped to the owning user
- Admin audit logs: scoped to admin users

## File Storage
- Files uploaded through Next.js API → Google Drive API
- App enforces permissions; Drive is storage-only
- All files live under one root folder per env config
- Metadata indexed in Supabase `file_assets` table
