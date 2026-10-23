-- SEO fields for articles and a public cover bucket.
-- Apply in the Supabase SQL editor if this migration is not already on the remote database.
-- cover_image_url already exists from 005; the statement below is safe to repeat.

alter table public.articles
  add column if not exists cover_image_url text,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists og_image_url text,
  add column if not exists source text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-covers',
  'article-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read article covers" on storage.objects;
create policy "public read article covers"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'article-covers');

drop policy if exists "admins insert article covers" on storage.objects;
create policy "admins insert article covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'article-covers'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "admins update article covers" on storage.objects;
create policy "admins update article covers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'article-covers'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'article-covers'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "admins delete article covers" on storage.objects;
create policy "admins delete article covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'article-covers'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
