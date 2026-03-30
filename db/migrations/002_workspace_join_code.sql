-- ============================================================
-- MIGRATION 002: Workspace Join Codes
-- ============================================================
-- Adds a stable, reusable join code to each workspace.
-- Owners can rotate, enable, or disable the code.
-- ============================================================

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS join_code_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS join_code_last_rotated_at TIMESTAMPTZ;

-- Backfill existing workspaces with a random 8-char code
UPDATE public.workspaces
SET join_code = SUBSTRING(gen_random_uuid()::TEXT, 1, 8)
WHERE join_code IS NULL;

-- Now make join_code NOT NULL
ALTER TABLE public.workspaces ALTER COLUMN join_code SET NOT NULL;

-- Index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_join_code ON public.workspaces(join_code);
