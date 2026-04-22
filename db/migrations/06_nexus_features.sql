-- ============================================================
-- Migration 06: Nexus Features
-- Adds: notification priority, meeting extractions, telegram links
-- ============================================================

-- 1. Extend notifications table with priority & channel
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'in_app'
    CHECK (channel IN ('in_app', 'email', 'telegram'));

-- 2. Meeting Extractions (Smart Task Extraction from transcripts)
CREATE TABLE IF NOT EXISTS public.meeting_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  raw_input TEXT NOT NULL,
  extracted_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  tasks_created INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meeting_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own extractions"
  ON public.meeting_extractions FOR ALL
  USING (auth.uid() = user_id);

-- 3. Telegram account linking
CREATE TABLE IF NOT EXISTS public.telegram_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own telegram link"
  ON public.telegram_links FOR ALL
  USING (auth.uid() = user_id);

-- 4. Telegram link codes (temporary, for linking flow)
CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own link codes"
  ON public.telegram_link_codes FOR ALL
  USING (auth.uid() = user_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
  ON public.tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_extractions_workspace
  ON public.meeting_extractions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_priority
  ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_telegram_links_user
  ON public.telegram_links(user_id);
