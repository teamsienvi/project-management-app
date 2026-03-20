-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- Internal Workspace Project Manager
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storyboard_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: check if user is a member of a workspace
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES: users can read/update their own profile
-- ============================================================
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- WORKSPACES: readable if user is a member
-- ============================================================
CREATE POLICY workspaces_select ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(id));

CREATE POLICY workspaces_insert ON public.workspaces
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY workspaces_update ON public.workspaces
  FOR UPDATE USING (public.is_workspace_member(id));

-- ============================================================
-- WORKSPACE MEMBERS: readable if user is in same workspace
-- ============================================================
CREATE POLICY workspace_members_select ON public.workspace_members
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY workspace_members_insert ON public.workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_workspace_member(workspace_id));

CREATE POLICY workspace_members_update ON public.workspace_members
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

-- ============================================================
-- WORKSPACE INVITATIONS: managed server-side (service role)
-- Users can read invitations where they are the inviter or the invited email matches
-- ============================================================
CREATE POLICY workspace_invitations_select ON public.workspace_invitations
  FOR SELECT USING (
    invited_by = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.is_workspace_member(workspace_id)
  );

-- ============================================================
-- TASKS: visible within member workspaces
-- ============================================================
CREATE POLICY tasks_select ON public.tasks
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND created_by = auth.uid());

CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

-- ============================================================
-- TASK NOTES: visible within member workspaces
-- ============================================================
CREATE POLICY task_notes_select ON public.task_notes
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY task_notes_insert ON public.task_notes
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND created_by = auth.uid());

-- ============================================================
-- TASK WATCHERS: visible within member workspaces
-- ============================================================
CREATE POLICY task_watchers_select ON public.task_watchers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id AND public.is_workspace_member(t.workspace_id)
    )
  );

CREATE POLICY task_watchers_insert ON public.task_watchers
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id AND public.is_workspace_member(t.workspace_id)
    )
  );

CREATE POLICY task_watchers_delete ON public.task_watchers
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- TASK ACTIVITY: visible within member workspaces
-- ============================================================
CREATE POLICY task_activity_select ON public.task_activity
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY task_activity_insert ON public.task_activity
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND actor_user_id = auth.uid());

-- ============================================================
-- STORYBOARD FOLDERS: visible within member workspaces
-- ============================================================
CREATE POLICY storyboard_folders_select ON public.storyboard_folders
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY storyboard_folders_insert ON public.storyboard_folders
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND created_by = auth.uid());

CREATE POLICY storyboard_folders_update ON public.storyboard_folders
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

-- ============================================================
-- FILE ASSETS: visible within member workspaces
-- ============================================================
CREATE POLICY file_assets_select ON public.file_assets
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY file_assets_insert ON public.file_assets
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND uploaded_by = auth.uid());

CREATE POLICY file_assets_update ON public.file_assets
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

-- ============================================================
-- NOTIFICATIONS: users can only see/update their own
-- ============================================================
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- ADMIN AUDIT LOGS: only admins can read
-- ============================================================
CREATE POLICY admin_audit_logs_select ON public.admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
