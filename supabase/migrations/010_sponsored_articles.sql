-- Sponsored partner articles.
-- Apply in the Supabase SQL editor after 009_category_descriptions.sql.

alter table public.articles
  add column if not exists is_sponsored boolean not null default false,
  add column if not exists sponsor_name text,
  add column if not exists sponsor_url text;

alter table public.articles drop constraint if exists articles_sponsor_url_https;
alter table public.articles
  add constraint articles_sponsor_url_https check (
    sponsor_url is null or sponsor_url ~* '^https://'
  );

alter table public.articles drop constraint if exists articles_sponsored_details;
alter table public.articles
  add constraint articles_sponsored_details check (
    is_sponsored = false
    or (
      coalesce(length(btrim(sponsor_name)), 0) > 0
      and sponsor_url ~* '^https://'
    )
  );

create or replace function public.sync_article_sponsored()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_slug text;
begin
  if new.category_id is null then
    new.is_sponsored := false;
    return new;
  end if;

  select slug into category_slug
  from public.article_categories
  where id = new.category_id;

  new.is_sponsored := category_slug = 'partneri';
  return new;
end;
$$;

drop trigger if exists sync_article_sponsored on public.articles;
create trigger sync_article_sponsored
before insert or update of category_id, is_sponsored, sponsor_name, sponsor_url
on public.articles
for each row
execute function public.sync_article_sponsored();

insert into public.article_categories (name, slug, description, color_accent, sort_order, is_published)
values (
  'Партньори',
  'partneri',
  'Материали от партньори на платформата. Етикетирани като спонсорирано съдържание.',
  '#0F766E',
  0,
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  color_accent = excluded.color_accent,
  sort_order = excluded.sort_order,
  is_published = true;
