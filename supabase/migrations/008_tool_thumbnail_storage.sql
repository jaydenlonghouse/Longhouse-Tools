-- Public storage bucket for tool card preview images (uploaded by Developers)
-- Run this in Supabase → SQL Editor if uploads fail with "Bucket not found".

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tool-thumbnails',
  'tool-thumbnails',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Developers upload tool thumbnails" on storage.objects;
drop policy if exists "Developers update tool thumbnails" on storage.objects;
drop policy if exists "Developers delete tool thumbnails" on storage.objects;
drop policy if exists "Public read tool thumbnails" on storage.objects;

create policy "Developers upload tool thumbnails"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tool-thumbnails'
    and public.is_developer()
  );

create policy "Developers update tool thumbnails"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'tool-thumbnails' and public.is_developer())
  with check (bucket_id = 'tool-thumbnails' and public.is_developer());

create policy "Developers delete tool thumbnails"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'tool-thumbnails' and public.is_developer());

create policy "Public read tool thumbnails"
  on storage.objects for select
  to public
  using (bucket_id = 'tool-thumbnails');
