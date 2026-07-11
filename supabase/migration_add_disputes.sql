-- 1. Add source_msg_ref to commits (Already exists for some environments)
-- ALTER TABLE commits ADD COLUMN IF NOT EXISTS source_msg_ref TEXT;
-- ALTER TABLE commits ADD CONSTRAINT commits_source_msg_ref_key UNIQUE (source_msg_ref);

-- 2. Add dispute_status enum/text column
ALTER TABLE commits ADD COLUMN IF NOT EXISTS dispute_status TEXT DEFAULT 'none';
-- Drop constraint if exists to avoid error on retry? Or just add if not exists (Postgres doesn't support ADD CONSTRAINT IF NOT EXISTS natively easily without DO block)
-- We will try adding it, assuming it doesn't exist yet.
ALTER TABLE commits ADD CONSTRAINT commits_dispute_status_check CHECK (dispute_status IN ('none', 'pending', 'won', 'lost'));
