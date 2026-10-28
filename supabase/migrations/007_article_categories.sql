-- Article categories for the public „Полезно“ section.
-- Apply in the Supabase SQL editor. Safe to run more than once.
-- Does not depend on 006_articles_seo.sql.

create table if not exists public.article_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  color_accent text,
  cover_image_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_categories_slug_key unique (slug),
  constraint article_categories_color_accent_check check (
    color_accent is null or color_accent ~ '^#[0-9A-Fa-f]{6}$'
  )
);

alter table public.articles
  add column if not exists category_id uuid references public.article_categories (id) on delete set null;

create index if not exists article_categories_published_sort_idx
  on public.article_categories (is_published, sort_order, name);

create index if not exists articles_category_id_idx
  on public.articles (category_id);

drop trigger if exists set_article_categories_updated_at on public.article_categories;
create trigger set_article_categories_updated_at
before update on public.article_categories
for each row execute function public.set_updated_at();

alter table public.article_categories enable row level security;

drop policy if exists "public read published article categories" on public.article_categories;
create policy "public read published article categories"
on public.article_categories
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "admins manage article categories" on public.article_categories;
create policy "admins manage article categories"
on public.article_categories
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "service role full access article categories" on public.article_categories;
create policy "service role full access article categories"
on public.article_categories
for all
to service_role
using (true)
with check (true);

grant select on public.article_categories to anon, authenticated;
grant insert, update, delete on public.article_categories to authenticated;
grant all on public.article_categories to service_role;

insert into public.article_categories (name, slug, description, color_accent, sort_order, is_published)
values
  (
    'Симптоми и състояния',
    'simptomi-i-sastoyaniya',
    'Чести оплаквания и състояния, и кога е разумно да се потърси преглед.',
    '#0F766E',
    1,
    true
  ),
  (
    'Изследвания и подготовка',
    'izsledvaniya-i-podgotovka',
    'Какво да очаквате преди лаборатория, образна диагностика и други изследвания.',
    '#0EA5E9',
    2,
    true
  ),
  (
    'Детско здраве',
    'detsko-zdrave',
    'Ориентири за родители преди преглед на дете.',
    '#B45309',
    3,
    true
  ),
  (
    'Женско здраве',
    'jensko-zdrave',
    'Теми за женското здраве и подготовката за преглед.',
    '#E11D48',
    4,
    true
  ),
  (
    'Психично здраве',
    'psihichno-zdrave',
    'Ясни ориентири преди разговор със специалист по психично здраве.',
    '#4F46E5',
    5,
    true
  ),
  (
    'Съвети преди преглед',
    'saveti-predi-pregled',
    'Какво да подготвите, за да мине часът по-подредено.',
    '#0D9488',
    6,
    true
  ),
  (
    'Хранене и метаболизъм',
    'hranene-i-metabolizam',
    'Хранене, тегло и обмен на веществата преди консултация.',
    '#059669',
    7,
    true
  )
on conflict (slug) do nothing;

create or replace function public.suggest_article_category(article_title text, article_excerpt text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  blob text := translate(
    coalesce(article_title, '') || ' ' || coalesce(article_excerpt, ''),
    'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ',
    'абвгдежзийклмнопрстуфхцчшщъьюя'
  );
  symptoms uuid;
  advice uuid;
  fallback uuid;
begin
  select id into symptoms from public.article_categories where slug = 'simptomi-i-sastoyaniya';
  select id into advice from public.article_categories where slug = 'saveti-predi-pregled';
  select id into fallback
  from public.article_categories
  where is_published
  order by sort_order asc, name asc
  limit 1;

  if blob ~ '(симптом|състояни|болест|алерги|болка|заболяван|диагноз|възпален)' then
    return coalesce(symptoms, fallback);
  end if;

  if blob ~ '(преглед|подготовк|съвет|кабинет|запис)' then
    return coalesce(advice, fallback);
  end if;

  return fallback;
end;
$$;

revoke all on function public.suggest_article_category(text, text) from public;
grant execute on function public.suggest_article_category(text, text) to service_role;

create or replace function public.assign_article_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category_id is null then
    new.category_id := public.suggest_article_category(new.title, new.excerpt);
  end if;
  return new;
end;
$$;

drop trigger if exists assign_article_category on public.articles;
create trigger assign_article_category
before insert on public.articles
for each row execute function public.assign_article_category();

update public.articles as article
set category_id = picked.category_id
from (
  select id, public.suggest_article_category(title, excerpt) as category_id
  from public.articles
  where category_id is null
) as picked
where article.id = picked.id
  and picked.category_id is not null
  and article.category_id is null;
