-- Profile details used by the public doctor and facility pages.

alter table public.doctors
  add column if not exists short_description text,
  add column if not exists accepts_nhif boolean not null default false,
  add column if not exists accepts_children boolean not null default false,
  add column if not exists online_consultation boolean not null default false;

alter table public.facilities
  add column if not exists short_description text,
  add column if not exists accepts_nhif boolean not null default false,
  add column if not exists accepts_children boolean not null default false,
  add column if not exists online_consultation boolean not null default false;
