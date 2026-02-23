-- Migration: Create task_timeline table for Reddit-style task posts
-- This table stores user timeline entries with task titles and feelings/comments

CREATE TABLE IF NOT EXISTS task_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  comment TEXT,
  task_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE task_timeline ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and manage their own timeline entries
CREATE POLICY "Users can manage their own timeline entries" ON task_timeline
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster chronological queries
CREATE INDEX IF NOT EXISTS idx_task_timeline_user_created 
  ON task_timeline (user_id, created_at DESC);
