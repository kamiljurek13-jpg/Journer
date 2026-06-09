alter table chat_messages drop column entry_id;

drop index if exists chat_messages_user_entry_idx;
create index chat_messages_user_idx
  on chat_messages(user_id, created_at asc);
