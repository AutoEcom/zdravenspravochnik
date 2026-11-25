import {
  BookOpen,
  Building2,
  ClipboardCheck,
  Compass,
  Library,
  MessagesSquare,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { ContactModal } from "@/components/contact/contact-modal"
import { JsonLd } from "@/components/seo/json-ld"
import { createPageMetadata } from "@/components/seo/page-meta"
import { breadcrumbJsonLd } from "@/components/seo/schemas"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { operator } from "@/lib/operator"

export const metadata = createPageMetadata({
  title: "За нас",
  description:
    "Здравен справочник събира лекари, заведения и материали по теми, за да се ориентирате преди разговор със специалист.",
  path: "/za-nas",
})

const discover: {
  icon: LucideIcon
  title: string
  text: string
  links: { href: string; label: string }[]
}[] = [
  {
    icon: BookOpen,
    title: "Статии",
    text: "Кратки текстове по здравни теми. Те са с информативна цел и не заместват преглед при лекар.",
    links: [{ href: "/articles", label: "Към Полезно" }],
  },
  {
    icon: Compass,
    title: "Ориентири",
    text: "Посока към специалност, когато темата често води към определен профил — невролог, педиатър, кардиолог и други.",
    links: [{ href: "/specialisti", label: "Специалисти" }],
  },
  {
    icon: Library,
    title: "Каталог",
    text: "Профили на лекари и заведения с контакт, адрес и работно време, когато тези данни са публикувани.",
    links: [
      { href: "/specialisti", label: "Лекари" },
      { href: "/zavedenia", label: "Заведения" },
    ],
  },
  {
    icon: MessagesSquare,
    title: "Подготовка за разговор",
    text: "Бележки какво да уточните преди час: направление, град и въпросите към кабинета.",
    links: [{ href: "/articles/category/saveti-predi-pregled", label: "Съвети преди преглед" }],
  },
]

const topics = [
  { href: "/articles/category/simptomi-i-sastoyaniya", label: "Симптоми и състояния" },
  { href: "/articles/category/izsledvaniya-i-podgotovka", label: "Изследвания и подготовка" },
  { href: "/articles/category/detsko-zdrave", label: "Детско здраве" },
  { href: "/articles/category/jensko-zdrave", label: "Женско здраве" },
  { href: "/articles/category/psihichno-zdrave", label: "Психично здраве" },
  { href: "/articles/category/saveti-predi-pregled", label: "Съвети преди преглед" },
  { href: "/articles/category/hranene-i-metabolizam", label: "Хранене и метаболизъм" },
]

const principles = [
  {
    title: "Информативна цел",
    text: "Текстовете не са диагноза, лечение или персонален съвет.",
  },
  {
    title: "Без подредба като препоръка",
    text: "Мястото в списъка не означава, че даден профил е подходящ за вас.",
  },
  {
    title: "Ясен етикет",
    text: "Материалите от партньори се отбелязват като „Спонсорирано“.",
  },
  {
    title: "Проверка при източника",
    text: "Адрес, телефон и час се потвърждават директно с кабинета.",
  },
]

const steps = [
  "Събираме публично достъпни данни за лекари и заведения и ги подреждаме по специалност и град.",
  "Лекар или заведение може да заяви профила и да потвърди данните.",
  "Статиите в Полезно се подготвят по седемте области и водят към съответния каталог.",
  "Партньорски материали се публикуват отделно, с етикет „Спонсорирано“.",
]

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-10 sm:gap-16 sm:py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Начало", path: "/" },
          { name: "За нас", path: "/za-nas" },
        ])}
      />

      <header className="max-w-3xl">
        <p className="text-sm font-medium tracking-wide text-primary">Здравен справочник</p>
        <h1 className="mt-3">За нас</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Здравен справочник събира на едно място лекари, лечебни заведения и кратки материали, за да намерите
          специалист по направление и град и да се ориентирате преди разговора с него.
        </p>
      </header>

      <section className="flex flex-col gap-5">
        <h2>Какво ще откриете тук</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {discover.map((item) => (
            <GlassCard key={item.title} variant="panel" className="flex flex-col gap-4">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div className="flex flex-1 flex-col gap-2">
                <h3>{item.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {item.links.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="max-w-3xl">
          <h2>Седемте области в Полезно</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Материалите са подредени по теми. Всяка води към статии и, където е уместно, към профили в каталога.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <li key={topic.href}>
              <Link
                href={topic.href}
                className="inline-flex rounded-full border border-primary/15 bg-white/70 px-3.5 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {topic.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-5">
        <h2>Редакционни принципи</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map((item, index) => (
            <GlassCard key={item.title} className="flex gap-4">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <div>
                <h3>{item.title}</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2>Как се създава справочникът</h2>
        <ol className="grid gap-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4 rounded-2xl border border-white/70 bg-white/50 px-4 py-4 sm:px-5">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <p className="pt-0.5 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <GlassCard variant="panel" className="flex gap-4">
        <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <h2 className="text-lg">Актуалност на данните</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Адрес, телефон и работно време могат да липсват или да са остарели. Преди посещение потвърдете часа и
            условията с кабинета или регистратурата.
          </p>
        </div>
      </GlassCard>

      <section className="rounded-2xl border border-slate-200/90 bg-slate-50/80 px-5 py-5 sm:px-6">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-slate-500" aria-hidden />
          <div>
            <h2 className="text-lg">Медицинска отговорност</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Здравен справочник е информационен справочник, а не медицинска услуга. Не поставяме диагноза и не
              предписваме лечение. При оплаквания се обърнете към лекар. При спешност се обадете на{" "}
              <strong className="font-semibold text-foreground">112</strong>.
            </p>
          </div>
        </div>
      </section>

      <GlassCard variant="strong" className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-xl gap-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Stethoscope className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl">За лекари и заведения</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Ако профилът е ваш, заявете го и потвърдете публичните данни.
            </p>
          </div>
        </div>
        <Link href="/claim" className={buttonVariants({ variant: "primary", className: "w-full sm:w-auto" })}>
          Заяви / верифицирай профил
        </Link>
      </GlassCard>

      <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex max-w-2xl gap-3 text-sm leading-relaxed text-muted-foreground">
          <Building2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Имаме опит с медицински уеб — сайтове и съдържание за практики и здравни марки. Оператор:{" "}
            {operator.name}, {operator.address}.{" "}
            <a href={`mailto:${operator.email}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {operator.email}
            </a>
          </span>
        </p>
        <ContactModal kind="about" label="Свържете се с нас" />
      </div>
    </main>
  )
}
