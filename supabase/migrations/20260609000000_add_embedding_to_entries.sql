create extension if not exists vector;

alter table entries
  add column if not exists embedding vector(1536);

create index entries_embedding_hnsw_idx
  on entries
  using hnsw (embedding vector_cosine_ops);
