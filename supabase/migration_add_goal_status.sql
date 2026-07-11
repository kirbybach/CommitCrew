-- Migration: Add status column to goals table
-- Run this in Supabase SQL Editor

-- 1. Add status column with default 'active'
ALTER TABLE goals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Migrate existing data based on active column
UPDATE goals SET status = CASE 
  WHEN active = true THEN 'active'
  ELSE 'deleted'
END
WHERE status = 'active'; -- Only update rows that haven't been migrated yet

-- 3. Add check constraint for valid statuses
ALTER TABLE goals ADD CONSTRAINT goals_status_check 
  CHECK (status IN ('active', 'completed', 'deleted'));

-- 4. (Optional) Drop old active column after confirming migration worked
-- ALTER TABLE goals DROP COLUMN active;
