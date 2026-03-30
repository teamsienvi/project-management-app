-- ============================================================
-- MIGRATION 003: Fix Profile RLS for Workspace Co-Members
-- ============================================================
-- The original profiles_select policy only allowed users to see
-- their own profile (id = auth.uid()). This broke the embedded
-- profiles(full_name, avatar_url) select in member queries because
-- users could not read their co-members' profiles.
--
-- This migration replaces the policy so workspace co-members
-- can see each other's profiles. The UPDATE policy remains
-- restricted to own profile only.
-- ============================================================

DROP POLICY IF EXISTS profiles_select ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
    )
  );
