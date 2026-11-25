-- Stop anonymous reads of account profiles, and limit claim-code guessing.
-- Apply after 010_sponsored_articles.sql.

drop policy if exists "public read profiles during development" on public.profiles;

revoke select on public.profiles from anon;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

alter table public.claim_requests
  add column if not exists failed_attempts integer not null default 0,
  add column if not exists code_send_count integer not null default 0,
  add column if not exists code_sent_at timestamptz;
