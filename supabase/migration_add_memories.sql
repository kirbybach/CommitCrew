-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents
create table memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null, -- clean up if user is deleted
  content text,
  embedding vector(1536), -- 1536 dimensions for text-embedding-3-small
  type text check (type in ('commit_log', 'conversation_summary')),
  metadata jsonb default '{}'::jsonb,
  is_archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SECURE THE TABLE
-- Enable Row Level Security (RLS)
-- By default, this blocks ALL access (anon/public) unless a policy exists.
-- Since our Bot uses the CREATE_CLIENT (service_role) key, it will bypass RLS and still work.
-- This effectively makes the table private to the backend.
alter table memories enable row level security;

-- Create a function to match documents (for future RPC calls if needed, though we might just query directly)
create or replace function match_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float,
  created_at timestamptz,
  metadata jsonb
)
language plpgsql
as $$
begin
  return query
  select
    memories.id,
    memories.content,
    1 - (memories.embedding <=> query_embedding) as similarity,
    memories.created_at,
    memories.metadata
  from memories
  where 1 - (memories.embedding <=> query_embedding) > match_threshold
  and memories.user_id = p_user_id
  and memories.is_archived = false
  order by memories.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create indexes for performance
create index on memories using hnsw (embedding vector_cosine_ops);
create index on memories (user_id, created_at);
