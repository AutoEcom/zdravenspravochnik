-- Articles admin access and cover image column.
-- The table from 001 already has id, title, slug, excerpt, content, author_id,
-- status, published_at, created_at and updated_at. cover_url stays in sync with cover_image_url.

alter table public.articles
  add column if not exists cover_image_url text;

update public.articles
set cover_image_url = cover_url
where cover_image_url is null
  and cover_url is not null;

create index if not exists articles_published_at_idx
  on public.articles (published_at desc);

drop policy if exists "admins manage articles" on public.articles;
create policy "admins manage articles"
on public.articles
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

grant insert, update, delete on public.articles to authenticated;

insert into public.articles (slug, title, excerpt, content, status, published_at)
values
  (
    'kak-da-se-podgotvite-za-parvi-pregled',
    'Как да се подготвите за първи преглед при специалист',
    'Какво да запишете преди часа, за да стигнете по-бързо до ясната следваща стъпка.',
    E'Първият преглед върви по-гладко, когато лекарят чуе кратка и подредена история, а не дълъг списък от предположения.\n\n## Какво да запишете преди часа\n\n- Кога е започнало оплакването и дали се променя\n- Какво вече сте пробвали и какъв е бил резултатът\n- Лекарства и добавки, които приемате в момента\n- Предишни изследвания, ако ги имате на хартия или в телефона\n\nНосете личната карта и документа за здравно осигуряване, ако очаквате прием по НЗОК. Ако часът е за дете, добре е да дойде и възрастният, който познава дневния режим.\n\n## Какво да попитате в кабинета\n\nПоискайте една ясна следваща стъпка: лечение, наблюдение или допълнително изследване. Запишете я още там, заедно с това кога да се чуете отново, ако оплакването не отшуми.',
    'published',
    '2026-10-18T08:00:00.000Z'
  ),
  (
    'kakvo-da-proverite-predi-chas-pri-lekar',
    'Какво да проверите, преди да запишете час при лекар',
    'Няколко неща, които спестяват грешен адрес, неясен прием и повторен разговор.',
    E'Преди да запазите час, отделете минута за данните в профила. Така разбирате дали специалистът работи във вашия град и как се стига до кабинета.\n\n## Проверете в справочника\n\n1. Специалността съвпада ли с причината за посещението\n2. Градът и адресът са ли същите, до които можете да стигнете\n3. Има ли телефон или друг начин за записване\n4. Приема ли деца или работи ли с НЗОК, ако това ви трябва\n\nАко профилът няма час онлайн, обадете се по посочения телефон и кажете накратко оплакването. Така регистратурата може да ви насочи към правилния кабинет още преди посещението.',
    'published',
    '2026-10-20T08:00:00.000Z'
  )
on conflict (slug) do nothing;
