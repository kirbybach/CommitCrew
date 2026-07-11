-- Add fallback_chat_user_id column
ALTER TABLE users ADD COLUMN fallback_chat_user_id text UNIQUE;

-- Create mandatory index for performance
CREATE INDEX IF NOT EXISTS idx_users_fallback_chat_user_id ON users(fallback_chat_user_id);
