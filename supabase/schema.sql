-- Enable Row Level Security (RLS) is good practice but for this MVP we might start open or simple policies.
-- USERS TABLE
create table public.users (
  id uuid default gen_random_uuid() primary key,
  chat_user_id text not null unique,
  name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);
alter table public.users enable row level security;
create policy "Allow public read access" on public.users for select using (true);

-- GOALS TABLE
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  description text not null,
  active boolean default true,
  created_at timestamp with time zone default now()
);
alter table public.goals enable row level security;
create policy "Allow public read access" on public.goals for select using (true);

-- COMMITS TABLE
create table public.commits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  source_msg_ref text unique, -- For deduplication
  group_id text, -- whatsapp group jid
  message text,
  ai_feedback text,
  grade integer,
  created_at timestamp with time zone default now()
);
alter table public.commits enable row level security;
create policy "Allow public read access" on public.commits for select using (true);

-- Create a view for the dashboard if needed, or just select direct.
