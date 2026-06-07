create table chat_messages (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  entry_id    uuid        not null references entries(id) on delete cascade,
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  created_at  timestamptz not null default now()
);

create index chat_messages_user_entry_idx
  on chat_messages(user_id, entry_id, created_at asc);

alter table chat_messages enable row level security;

create policy "users_own_chat_messages" on chat_messages
  for all to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
