# Здравен справочник

Next.js 15 приложение с App Router, TypeScript, Tailwind CSS и ESLint. Темата по подразбиране е светла. Тъмната палитра е подготвена за по-късно през `next-themes`.

## Изисквания

- Node.js 20 или по-нова версия
- npm
- Supabase проект

## Стартиране

1. Инсталирайте зависимостите:

```bash
npm install
```

2. Копирайте примерния файл с променливи:

```bash
copy .env.local.example .env.local
```

3. Попълнете стойностите в `.env.local`:

| Променлива | Къде се ползва |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Публичен адрес на Supabase проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичен anon ключ за браузър и сървър |
| `SUPABASE_SERVICE_ROLE_KEY` | Само на сървъра. Не го излагайте в клиентски код |
| `NEXT_PUBLIC_SITE_URL` | Адрес на приложението. Локално: `http://localhost:3000` |

Без URL и anon ключ приложението се отваря, но middleware не опреснява сесия.

4. Стартирайте dev сървъра:

```bash
npm run dev
```

Отворете [http://localhost:3000](http://localhost:3000).

## Скриптове

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Структура

```text
app/(public)          публични страници
app/(auth)            вход
app/dashboard         табло
app/admin             администрация
components/ui         shadcn/ui
components/doctors
components/facilities
components/search
lib/supabase          browser, server и session middleware
types
supabase/migrations
```

## Supabase

Клиентите следват официалния модел за Next.js 15:

- `lib/supabase/client.ts` — браузър (`createBrowserClient`)
- `lib/supabase/server.ts` — Server Components, Server Actions и Route Handlers
- `lib/supabase/middleware.ts` — `updateSession`, който вика `supabase.auth.getClaims()`
- `middleware.ts` в корена — Next.js 15 вика този файл. В Next.js 16 същото се казва `proxy.ts`

SQL миграциите стоят в `supabase/migrations`.

## Интерфейс

shadcn/ui е инициализиран с настройките по подразбиране (`base-nova`). Добавени са button, card, input, select, dialog, dropdown-menu, tabs, avatar, badge, skeleton, sonner, label и field.

В текущия регистър записът `form` е празен. `components/ui/form.tsx` е React Hook Form обвивката (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`), а `components/ui/field.tsx` е актуалният layout компонент от shadcn.

Основният цвят е teal. Класът `glass` дава полупрозрачен фон с blur.
