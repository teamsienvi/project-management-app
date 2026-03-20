# Smoke Tests

Manual smoke test checklist for verifying the app works end-to-end.

## Authentication
- [ ] `/login` page renders correctly
- [ ] Can sign in with valid credentials
- [ ] Invalid credentials show error
- [ ] `/forgot-password` sends reset email
- [ ] Unauthenticated users are redirected to `/login`
- [ ] Authenticated users are redirected from `/login` to `/dashboard`

## Workspace
- [ ] New user sees onboarding page
- [ ] Can create first workspace
- [ ] Workspace appears in sidebar
- [ ] Can switch between workspaces
- [ ] Can rename workspace (owner/manager)

## Members
- [ ] Members list shows all workspace members
- [ ] Can invite a member by email (owner/manager)
- [ ] Invited user can accept invite with token
- [ ] Owner can change member roles
- [ ] Non-owner cannot see role change controls

## Tasks
- [ ] Can create a new task
- [ ] Task appears in task list
- [ ] Can filter tasks by status and priority
- [ ] Can click task to view details
- [ ] Can edit task (title, status, priority, assignee, due date)
- [ ] Can add notes to a task
- [ ] Can mark task as complete
- [ ] Completing a task creates notifications for creator/assignee/watchers

## Storyboards
- [ ] Can create a storyboard folder
- [ ] Folder appears in storyboard list
- [ ] Can open folder detail page
- [ ] Can upload a file to a folder

## Files
- [ ] Can upload a file from the files page
- [ ] File appears in file list
- [ ] Can open a file (opens in new tab)
- [ ] Can delete a file
- [ ] File metadata shows correct info (name, type, size)

## Notifications
- [ ] Notification bell shows unread count
- [ ] Can view notification list
- [ ] Can mark notification as read

## Admin
- [ ] Admin user can access `/admin`
- [ ] Non-admin user is redirected from `/admin`
- [ ] Admin dashboard shows user and workspace counts
- [ ] Admin can view all users
- [ ] Admin can view all workspaces
- [ ] Admin can view audit logs

## Security
- [ ] API routes return 401 without auth
- [ ] Non-member cannot access workspace data
- [ ] RLS prevents cross-workspace data access in browser console
- [ ] Google credentials are not in client bundle
