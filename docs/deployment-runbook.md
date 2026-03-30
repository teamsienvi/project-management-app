# Deployment Runbook

## Vercel Deployment

### 1. Push to GitHub
```bash
git add . && git commit -m "Initial release" && git push
```

### 2. Import in Vercel
1. Go to [Vercel](https://vercel.com)
2. Import the repository
3. Framework: Next.js (auto-detected)

### 3. Environment Variables
Add all variables from `.env.example` in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` → your Vercel deployment URL
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `GOOGLE_DRIVE_OWNER_EMAIL`
- `RESEND_API_KEY` (optional — email invites)
- `RESEND_FROM_EMAIL` (optional)
- `RESEND_REPLY_TO` (optional)
- `APP_BRAND_NAME` (optional, default: IWPM)

### 3.1 Database Migrations
Run in Supabase SQL Editor:
- `db/migrations/001_initial_schema.sql`
- `db/migrations/002_workspace_join_code.sql`
- `db/policies/rls_policies.sql`

### 4. Deploy
Click Deploy. Verify the build succeeds.

## Post-Deployment Checklist
- [ ] Login page loads at `/login`
- [ ] Can sign in with test credentials
- [ ] Dashboard loads with workspaces
- [ ] Can create a new workspace
- [ ] Can navigate to tasks page
- [ ] API routes return proper auth errors without token

## Rollback
1. In Vercel, go to Deployments
2. Find the previous working deployment
3. Click "..." → Promote to Production

## Troubleshooting

### Build fails with type errors
```bash
npm run typecheck  # Run locally to see errors
```

### Google Drive upload fails
- Verify `GOOGLE_DRIVE_REFRESH_TOKEN` is valid
- Check that root folder ID exists and is accessible
- Ensure Drive API is enabled in Google Cloud Console

### Supabase connection fails
- Verify URL and keys are correct
- Check if project is paused (free tier)
- Verify RLS policies are applied

### Windows Docker Issues
- Use WSL2 backend for Docker Desktop
- Ensure `.env.local` uses LF line endings
- Map ports explicitly: `docker run -p 3000:3000`
