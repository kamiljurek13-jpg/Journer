create table api_tokens (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  token_hash   text        not null unique,
  name         text        not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

create index api_tokens_user_id_idx on api_tokens(user_id);
create index api_tokens_hash_idx    on api_tokens(token_hash);

alter table api_tokens enable row level security;

create policy "users_own_tokens" on api_tokens
  for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
