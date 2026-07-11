-- Migration: Pivot to Weekly Wins
-- Run this in Supabase SQL Editor

-- Rename column
ALTER TABLE users RENAME COLUMN daily_wins_count TO weekly_wins_count;

-- Ensure default and non-null if not already (safekeeping)
ALTER TABLE users ALTER COLUMN weekly_wins_count SET DEFAULT 0;
UPDATE users SET weekly_wins_count = 0 WHERE weekly_wins_count IS NULL;
