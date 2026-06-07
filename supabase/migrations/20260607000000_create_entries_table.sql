-- Migration: create entries table
-- Applied via MCP Supabase on 2026-06-07

create table entries (
  id          uuid        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  date        text        not null,
  title       text,
  body        text        not null,
  mood        smallint    not null check (mood between 1 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint entries_user_date_unique unique (user_id, date)
);

alter table entries enable row level security;

create policy "users_own_entries" on entries
  for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
