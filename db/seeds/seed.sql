-- ============================================================
-- SEED DATA
-- Internal Workspace Project Manager
--
-- NOTE: This seed references placeholder user IDs.
-- You MUST first create test users in Supabase Auth, then
-- replace these UUIDs with the actual auth.users IDs.
-- ============================================================

-- Placeholder user IDs (replace after creating users in Supabase Auth)
-- Admin user:  11111111-1111-1111-1111-111111111111
-- Normal user: 22222222-2222-2222-2222-222222222222

-- Profiles (created automatically by trigger, but we can update them)
UPDATE public.profiles SET full_name = 'Admin User', is_admin = TRUE
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET full_name = 'Team Member'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Workspace
INSERT INTO public.workspaces (id, name, slug, created_by) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Marketing Ops', 'marketing-ops-seed', '11111111-1111-1111-1111-111111111111');

-- Workspace Members
INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member');

-- Tasks
INSERT INTO public.tasks (id, workspace_id, title, description, status, priority, created_by, assignee_user_id) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Design landing page', 'Create initial wireframes and mockups', 'in_progress', 'high', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Set up CI/CD pipeline', 'Configure GitHub Actions for auto deploy', 'todo', 'medium', '11111111-1111-1111-1111-111111111111', NULL),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Write API documentation', 'Document all endpoints', 'review', 'low', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111');

-- Task Notes
INSERT INTO public.task_notes (task_id, workspace_id, body, created_by) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Started working on the hero section. Will share draft by EOD.', '22222222-2222-2222-2222-222222222222');

-- Storyboard Folders
INSERT INTO public.storyboard_folders (id, workspace_id, name, description, created_by) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Campaign Assets', 'Main folder for campaign storyboards', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Brand Guidelines', 'Logo, colors, typography', '11111111-1111-1111-1111-111111111111');

-- Notifications
INSERT INTO public.notifications (user_id, workspace_id, type, title, body) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'task_assigned', 'Task Assigned', 'You''ve been assigned: "Design landing page"'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member_added', 'New Member', 'A new member has joined Marketing Ops.');
