-- Enable replication for specific tables to support Realtime subscriptions
-- This allows the dashboard to receive updates when data changes

-- Add tables to the publication
alter publication supabase_realtime add table public.commits;
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.goals;
