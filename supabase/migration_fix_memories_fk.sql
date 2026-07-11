-- Fix Foreign Key Constraint
-- The original migration referenced 'auth.users' (Supabase Auth), 
-- but our bot uses a custom 'public.users' table for WhatsApp users.

-- 1. Drop the incorrect constraint
ALTER TABLE memories
DROP CONSTRAINT IF EXISTS memories_user_id_fkey;

-- 2. Add the correct constraint pointing to public.users
ALTER TABLE memories
ADD CONSTRAINT memories_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.users (id)
ON DELETE CASCADE;
