-- View counters for public profiles and articles.
-- Apply in the Supabase SQL editor after 007_article_categories.sql.

alter table public.doctors
  add column if not exists view_count integer not null default 0;

alter table public.facilities
  add column if not exists view_count integer not null default 0;

alter table public.articles
  add column if not exists view_count integer not null default 0;

create unique index if not exists reviews_author_doctor_uidx
  on public.reviews (author_id, doctor_id)
  where author_id is not null and doctor_id is not null;

create unique index if not exists reviews_author_facility_uidx
  on public.reviews (author_id, facility_id)
  where author_id is not null and facility_id is not null;
