-- Applied together with the journal-ops.ts change that switches hybridSearch's
-- vector leg to consume this shape. match_entries_by_vector now returns
-- strapi_entry_id instead of id, and no longer returns title/body: once entries
-- are cut over, those Supabase columns are frozen for anything created/edited
-- afterward, so the caller hydrates content from Strapi instead. Rows not yet
-- migrated (strapi_entry_id still null) are excluded.

-- CREATE OR REPLACE can't change a function's return row type, so drop first.
drop function if exists match_entries_by_vector(text, uuid, integer);

create function match_entries_by_vector(
  query_embedding  text,
  user_id_param    uuid,
  match_count      int default 30
)
returns table (
  strapi_entry_id text,
  date            text,
  mood            smallint,
  similarity      float
)
language sql
stable
as $$
  select
    e.strapi_entry_id,
    e.date,
    e.mood,
    1 - (e.embedding <=> query_embedding::vector) as similarity
  from entries e
  where
    e.user_id = user_id_param
    and e.embedding is not null
    and e.strapi_entry_id is not null
  order by e.embedding <=> query_embedding::vector
  limit match_count;
$$;
