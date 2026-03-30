-- Migration: Add storyboard_notes for in-app document editing
-- These are simple text/markdown notes that live inside storyboard folders

CREATE TABLE IF NOT EXISTS public.storyboard_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  storyboard_folder_id UUID REFERENCES public.storyboard_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT 'markdown',  -- 'markdown' or 'plaintext'
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_storyboard_notes_folder ON public.storyboard_notes(storyboard_folder_id);
CREATE INDEX IF NOT EXISTS idx_storyboard_notes_workspace ON public.storyboard_notes(workspace_id);

-- RLS
ALTER TABLE public.storyboard_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY storyboard_notes_select ON public.storyboard_notes
  FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY storyboard_notes_insert ON public.storyboard_notes
  FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY storyboard_notes_update ON public.storyboard_notes
  FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY storyboard_notes_delete ON public.storyboard_notes
  FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
