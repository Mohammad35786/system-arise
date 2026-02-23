-- Migration: add source task reference for idempotent automatic timeline posts

ALTER TABLE task_timeline
ADD COLUMN IF NOT EXISTS source_task_id UUID;

-- Prevent duplicate timeline entries for the same source task + type per user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_timeline_unique_source
  ON task_timeline (user_id, source_task_id, task_type)
  WHERE source_task_id IS NOT NULL;
