-- FORCE FIX for "operator does not exist: public.vector <=> public.vector"
-- This sets the search_path at the DATABASE ROLE level, so it applies to everything.

-- 1. Alter the role used by the bot (usually 'postgres' or 'authenticated' or 'service_role')
-- We'll try to set it for the current user and the database default.

ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE service_role SET search_path = public, extensions;
ALTER DATABASE postgres SET search_path = public, extensions;

-- 2. Re-apply the function fixes just in case
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
set search_path = public, extensions
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
