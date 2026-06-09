-- GIN index for full-text search on stripped body + title + date
create index if not exists entries_fts_idx
  on entries
  using gin (
    to_tsvector(
      'simple',
      date || ' ' ||
      coalesce(title, '') || ' ' ||
      regexp_replace(body, '<[^>]+>', ' ', 'g')
    )
  );

-- Vector similarity search (cosine distance via HNSW index)
-- query_embedding is a JSON string like "[0.1, -0.2, ...]" from JSON.stringify()
-- which is exactly what pgvector expects for the text->vector cast
create or replace function match_entries_by_vector(
  query_embedding  text,
  user_id_param    uuid,
  match_count      int default 30
)
returns table (
  id         uuid,
  date       text,
  title      text,
  body       text,
  mood       smallint,
  similarity float
)
language sql
stable
as $$
  select
    e.id,
    e.date,
    e.title,
    e.body,
    e.mood,
    1 - (e.embedding <=> query_embedding::vector) as similarity
  from entries e
  where
    e.user_id = user_id_param
    and e.embedding is not null
  order by e.embedding <=> query_embedding::vector
  limit match_count;
$$;

-- Full-text search using 'simple' dictionary (works for Polish and English)
-- plainto_tsquery handles plain queries without requiring FTS operators from caller
create or replace function match_entries_by_text(
  query_text      text,
  user_id_param   uuid,
  match_count     int default 30
)
returns table (
  id    uuid,
  date  text,
  title text,
  body  text,
  mood  smallint,
  rank  float
)
language sql
stable
as $$
  select
    e.id,
    e.date,
    e.title,
    e.body,
    e.mood,
    ts_rank_cd(
      to_tsvector(
        'simple',
        e.date || ' ' ||
        coalesce(e.title, '') || ' ' ||
        regexp_replace(e.body, '<[^>]+>', ' ', 'g')
      ),
      plainto_tsquery('simple', query_text)
    ) as rank
  from entries e
  where
    e.user_id = user_id_param
    and to_tsvector(
          'simple',
          e.date || ' ' ||
          coalesce(e.title, '') || ' ' ||
          regexp_replace(e.body, '<[^>]+>', ' ', 'g')
        ) @@ plainto_tsquery('simple', query_text)
  order by rank desc
  limit match_count;
$$;
