-- Migration: Add daily_wins_count to users table
-- Run this in Supabase SQL Editor

-- Add daily_wins_count column with default 0
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_wins_count INTEGER DEFAULT 0;

-- Backfill existing users (set to 0 if NULL)
UPDATE users SET daily_wins_count = 0 WHERE daily_wins_count IS NULL;
