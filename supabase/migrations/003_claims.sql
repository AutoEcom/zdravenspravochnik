-- Claim requests and owner edits for doctors and facilities.
-- Apply after 002_profile_details.sql.

alter table public.doctors
  add column if not exists is_claimed boolean not null default false,
  add column if not exists claimed_by uuid references public.profiles (id) on delete set null;

alter table public.facilities
  add column if not exists is_claimed boolean not null default false,
  add column if not exists claimed_by uuid references public.profiles (id) on delete set null;

create index if not exists doctors_claimed_by_idx on public.doctors (claimed_by);
create index if not exists facilities_claimed_by_idx on public.facilities (claimed_by);

create table if not exists public.claim_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  email text not null,
  status text not null default 'pending',
  email_verified boolean not null default false,
  code_hash text,
  code_expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint claim_requests_type_check check (target_type in ('doctor', 'facility')),
  constraint claim_requests_status_check check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists claim_requests_status_idx
  on public.claim_requests (status, created_at desc);

create index if not exists claim_requests_user_idx
  on public.claim_requests (user_id);

create unique index if not exists claim_requests_one_open
  on public.claim_requests (user_id, target_type, target_id)
  where status = 'pending';

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
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create or replace function public.freeze_profile_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists freeze_profile_role on public.profiles;
create trigger freeze_profile_role
before update on public.profiles
for each row execute function public.freeze_profile_role();

create or replace function public.freeze_doctor_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  new.profile_id := old.profile_id;
  new.slug := old.slug;
  new.full_name := old.full_name;
  new.title := old.title;
  new.photo_url := old.photo_url;
  new.address := old.address;
  new.specialties := old.specialties;
  new.cities := old.cities;
  new.status := old.status;
  new.is_featured := old.is_featured;
  new.is_premium := old.is_premium;
  new.rating := old.rating;
  new.review_count := old.review_count;
  new.is_claimed := old.is_claimed;
  new.claimed_by := old.claimed_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create or replace function public.freeze_facility_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  new.slug := old.slug;
  new.name := old.name;
  new.facility_type := old.facility_type;
  new.photo_url := old.photo_url;
  new.address := old.address;
  new.specialties := old.specialties;
  new.cities := old.cities;
  new.status := old.status;
  new.is_featured := old.is_featured;
  new.is_premium := old.is_premium;
  new.rating := old.rating;
  new.review_count := old.review_count;
  new.is_claimed := old.is_claimed;
  new.claimed_by := old.claimed_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists freeze_doctor_ownership on public.doctors;
create trigger freeze_doctor_ownership
before update on public.doctors
for each row execute function public.freeze_doctor_ownership();

drop trigger if exists freeze_facility_ownership on public.facilities;
create trigger freeze_facility_ownership
before update on public.facilities
for each row execute function public.freeze_facility_ownership();

drop policy if exists "owners read claimed doctors" on public.doctors;
create policy "owners read claimed doctors"
on public.doctors
for select
to authenticated
using (claimed_by = auth.uid());

drop policy if exists "owners update claimed doctors" on public.doctors;
create policy "owners update claimed doctors"
on public.doctors
for update
to authenticated
using (is_claimed = true and claimed_by = auth.uid())
with check (is_claimed = true and claimed_by = auth.uid());

drop policy if exists "owners read claimed facilities" on public.facilities;
create policy "owners read claimed facilities"
on public.facilities
for select
to authenticated
using (claimed_by = auth.uid());

drop policy if exists "owners update claimed facilities" on public.facilities;
create policy "owners update claimed facilities"
on public.facilities
for update
to authenticated
using (is_claimed = true and claimed_by = auth.uid())
with check (is_claimed = true and claimed_by = auth.uid());

alter table public.claim_requests enable row level security;

drop policy if exists "users read own claim requests" on public.claim_requests;
create policy "users read own claim requests"
on public.claim_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "admins read claim requests" on public.claim_requests;
create policy "admins read claim requests"
on public.claim_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "service role full access claim requests" on public.claim_requests;
create policy "service role full access claim requests"
on public.claim_requests
for all
to service_role
using (true)
with check (true);

grant update (
  bio,
  short_description,
  phone,
  email,
  website,
  working_hours,
  accepts_nhif,
  accepts_children,
  online_consultation
) on public.doctors to authenticated;

grant update (
  description,
  short_description,
  phone,
  email,
  website,
  working_hours,
  accepts_nhif,
  accepts_children,
  online_consultation
) on public.facilities to authenticated;

grant select on public.claim_requests to authenticated;
grant all on public.claim_requests to service_role;
