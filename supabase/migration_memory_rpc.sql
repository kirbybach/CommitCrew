-- Transaction to atomically insert summary and archive old logs
create or replace function summarize_memory_transaction(
  p_user_id uuid,
  p_summary_text text,
  p_summary_embedding vector(1536)
)
returns void
language plpgsql
as $$
begin
  -- 1. Insert the new summary
  insert into memories (user_id, content, embedding, type, metadata)
  values (
    p_user_id,
    p_summary_text,
    p_summary_embedding,
    'conversation_summary',
    jsonb_build_object('created_at', now())
  );

  -- 2. Archive the old logs (limit to only 'commit_log' to be safe)
  update memories
  set is_archived = true
  where user_id = p_user_id
    and type = 'commit_log'
    and is_archived = false;
end;
$$;
