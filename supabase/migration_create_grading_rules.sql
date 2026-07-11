-- Enable vector extension if not already enabled
create extension if not exists vector;

-- Create Grading Rules Table
create table public.grading_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  rule text not null,
  embedding vector(1536),
  origin_commit_id uuid references public.commits(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.grading_rules enable row level security;

-- Index for Vector Search
create index on public.grading_rules using hnsw (embedding vector_cosine_ops);
create index on public.grading_rules (user_id);

-- RPC Function for Similarity Search
create or replace function match_grading_rules (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  rule text,
  similarity float,
  created_at timestamptz,
  origin_commit_id uuid
)
language plpgsql
as $$
begin
  return query
  select
    grading_rules.id,
    grading_rules.rule,
    1 - (grading_rules.embedding <=> query_embedding) as similarity,
    grading_rules.created_at,
    grading_rules.origin_commit_id
  from grading_rules
  where 1 - (grading_rules.embedding <=> query_embedding) > match_threshold
  and grading_rules.user_id = p_user_id
  order by grading_rules.embedding <=> query_embedding
  limit match_count;
end;
$$;
