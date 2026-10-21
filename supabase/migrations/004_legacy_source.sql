-- Marks rows imported from the old WordPress directory.

alter table public.doctors
  add column if not exists source text;

alter table public.facilities
  add column if not exists source text;
