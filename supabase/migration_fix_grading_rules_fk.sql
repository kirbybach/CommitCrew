-- Fix Foreign Key Constraint for grading_rules
-- The original migration referenced 'auth.users' (Supabase Auth), 
-- but our bot uses a custom 'public.users' table for WhatsApp users.

-- 1. Drop the incorrect constraint
ALTER TABLE grading_rules
DROP CONSTRAINT IF EXISTS grading_rules_user_id_fkey;

-- 2. Add the correct constraint pointing to public.users
ALTER TABLE grading_rules
ADD CONSTRAINT grading_rules_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.users (id)
ON DELETE CASCADE;
