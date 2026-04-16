-- Migration: Add color properties to tasks

-- Default color 'gray' will apply to all existing tasks seamlessly
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'gray' NOT NULL;
