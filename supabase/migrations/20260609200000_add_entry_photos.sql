create table entry_photos (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  date         text        not null,
  storage_path text        not null,
  created_at   timestamptz not null default now()
);

create index entry_photos_user_date_idx on entry_photos(user_id, date);

alter table entry_photos enable row level security;

create policy "users_own_photos" on entry_photos
  for all to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('JournerImages', 'JournerImages', false);

create policy "users_upload_own_photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'JournerImages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users_read_own_photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'JournerImages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users_delete_own_photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'JournerImages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
