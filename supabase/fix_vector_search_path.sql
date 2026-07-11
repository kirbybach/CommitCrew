-- FIX for "operator does not exist: public.vector <=> public.vector"
-- The previous security fix removed 'public' from the search_path, hiding the vector operator.
-- This restores 'public' to the search_path for these functions.

-- 1. Fix match_grading_rules
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
set search_path = public, extensions  -- <--- FIXED: Added public/extensions
as $$
begin
  return query
  select
    public.grading_rules.id,
    public.grading_rules.rule,
    1 - (public.grading_rules.embedding <=> query_embedding) as similarity,
    public.grading_rules.created_at,
    public.grading_rules.origin_commit_id
  from public.grading_rules
  where 1 - (public.grading_rules.embedding <=> query_embedding) > match_threshold
  and public.grading_rules.user_id = p_user_id
  order by public.grading_rules.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 2. Fix match_memories
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
set search_path = public, extensions -- <--- FIXED
as $$
begin
  return query
  select
    public.memories.id,
    public.memories.content,
    1 - (public.memories.embedding <=> query_embedding) as similarity,
    public.memories.created_at,
    public.memories.metadata
  from public.memories
  where 1 - (public.memories.embedding <=> query_embedding) > match_threshold
  and public.memories.user_id = p_user_id
  and public.memories.is_archived = false
  order by public.memories.embedding <=> query_embedding
  limit match_count;
end;
$$;
