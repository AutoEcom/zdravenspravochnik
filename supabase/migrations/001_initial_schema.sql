-- Здравен справочник: initial schema.
-- uuid, text[], jsonb working_hours, numeric rating.
-- service_role bypasses RLS in Supabase; explicit policies are included as well.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cities_slug_key unique (slug)
);

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint specialties_slug_key unique (slug)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'patient',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (
    role in ('patient', 'doctor', 'facility_admin', 'admin')
  )
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  slug text not null,
  full_name text not null,
  title text,
  bio text,
  photo_url text,
  phone text,
  email text,
  website text,
  address text,
  specialties text[] not null default '{}',
  cities text[] not null default '{}',
  status text not null default 'draft',
  is_featured boolean not null default false,
  is_premium boolean not null default false,
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  working_hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctors_slug_key unique (slug),
  constraint doctors_status_check check (status in ('draft', 'published', 'archived')),
  constraint doctors_rating_check check (rating >= 0 and rating <= 5)
);

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  facility_type text not null default 'clinic',
  description text,
  address text,
  phone text,
  email text,
  website text,
  photo_url text,
  specialties text[] not null default '{}',
  cities text[] not null default '{}',
  status text not null default 'draft',
  is_featured boolean not null default false,
  is_premium boolean not null default false,
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  working_hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facilities_slug_key unique (slug),
  constraint facilities_type_check check (
    facility_type in (
      'hospital',
      'clinic',
      'practice',
      'laboratory',
      'pharmacy',
      'other'
    )
  ),
  constraint facilities_status_check check (status in ('draft', 'published', 'archived')),
  constraint facilities_rating_check check (rating >= 0 and rating <= 5)
);

create table public.facility_doctors (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  position text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facility_doctors_pair_key unique (facility_id, doctor_id)
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_url text,
  author_id uuid references public.profiles (id) on delete set null,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_slug_key unique (slug),
  constraint articles_status_check check (status in ('draft', 'published', 'archived'))
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors (id) on delete cascade,
  facility_id uuid references public.facilities (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  rating numeric(2, 1) not null,
  comment text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_check check (rating >= 1 and rating <= 5),
  constraint reviews_status_check check (status in ('pending', 'published', 'rejected')),
  constraint reviews_target_check check (doctor_id is not null or facility_id is not null)
);

-- slug indexes come from the unique constraints above.

create index doctors_status_idx on public.doctors (status);
create index doctors_cities_idx on public.doctors using gin (cities);
create index doctors_specialties_idx on public.doctors using gin (specialties);
create index doctors_is_featured_idx on public.doctors (is_featured);
create index doctors_is_premium_idx on public.doctors (is_premium);
create index doctors_created_at_idx on public.doctors (created_at desc);

create index facilities_status_idx on public.facilities (status);
create index facilities_cities_idx on public.facilities using gin (cities);
create index facilities_specialties_idx on public.facilities using gin (specialties);
create index facilities_is_featured_idx on public.facilities (is_featured);
create index facilities_is_premium_idx on public.facilities (is_premium);
create index facilities_created_at_idx on public.facilities (created_at desc);

create index facility_doctors_facility_id_idx on public.facility_doctors (facility_id);
create index facility_doctors_doctor_id_idx on public.facility_doctors (doctor_id);
create index facility_doctors_created_at_idx on public.facility_doctors (created_at desc);

create index articles_status_idx on public.articles (status);
create index articles_created_at_idx on public.articles (created_at desc);

create index reviews_status_idx on public.reviews (status);
create index reviews_created_at_idx on public.reviews (created_at desc);
create index reviews_doctor_id_idx on public.reviews (doctor_id);
create index reviews_facility_id_idx on public.reviews (facility_id);

create index cities_created_at_idx on public.cities (created_at desc);
create index specialties_created_at_idx on public.specialties (created_at desc);

create trigger set_cities_updated_at
before update on public.cities
for each row execute function public.set_updated_at();

create trigger set_specialties_updated_at
before update on public.specialties
for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_doctors_updated_at
before update on public.doctors
for each row execute function public.set_updated_at();

create trigger set_facilities_updated_at
before update on public.facilities
for each row execute function public.set_updated_at();

create trigger set_facility_doctors_updated_at
before update on public.facility_doctors
for each row execute function public.set_updated_at();

create trigger set_articles_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.cities enable row level security;
alter table public.specialties enable row level security;
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.facilities enable row level security;
alter table public.facility_doctors enable row level security;
alter table public.articles enable row level security;
alter table public.reviews enable row level security;

create policy "public read cities"
on public.cities
for select
to anon, authenticated
using (true);

create policy "public read specialties"
on public.specialties
for select
to anon, authenticated
using (true);

create policy "public read profiles during development"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "users update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "public read published doctors"
on public.doctors
for select
to anon, authenticated
using (status = 'published');

create policy "public read published facilities"
on public.facilities
for select
to anon, authenticated
using (status = 'published');

create policy "public read links of published records"
on public.facility_doctors
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.doctors
    where doctors.id = facility_doctors.doctor_id
      and doctors.status = 'published'
  )
  or exists (
    select 1
    from public.facilities
    where facilities.id = facility_doctors.facility_id
      and facilities.status = 'published'
  )
);

create policy "public read published articles"
on public.articles
for select
to anon, authenticated
using (status = 'published');

create policy "public read published reviews"
on public.reviews
for select
to anon, authenticated
using (status = 'published');

create policy "service role full access cities"
on public.cities
for all
to service_role
using (true)
with check (true);

create policy "service role full access specialties"
on public.specialties
for all
to service_role
using (true)
with check (true);

create policy "service role full access profiles"
on public.profiles
for all
to service_role
using (true)
with check (true);

create policy "service role full access doctors"
on public.doctors
for all
to service_role
using (true)
with check (true);

create policy "service role full access facilities"
on public.facilities
for all
to service_role
using (true)
with check (true);

create policy "service role full access facility doctors"
on public.facility_doctors
for all
to service_role
using (true)
with check (true);

create policy "service role full access articles"
on public.articles
for all
to service_role
using (true)
with check (true);

create policy "service role full access reviews"
on public.reviews
for all
to service_role
using (true)
with check (true);

grant select on public.cities, public.specialties, public.profiles, public.doctors, public.facilities, public.facility_doctors, public.articles, public.reviews to anon, authenticated;
grant all on public.cities, public.specialties, public.profiles, public.doctors, public.facilities, public.facility_doctors, public.articles, public.reviews to service_role;
