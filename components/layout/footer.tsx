import type { ReactNode } from "react"
import Link from "next/link"

import { LogoMark } from "@/components/layout/logo-mark"

function SocialIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      {children}
    </svg>
  )
}

const social: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: "Facebook",
    href: "https://facebook.com/zdravenspravochnik",
    icon: (
      <SocialIcon>
        <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.1C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7Z" />
      </SocialIcon>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/zdravenspravochnik",
    icon: (
      <SocialIcon>
        <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm8 1.8H8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8a3.2 3.2 0 0 0 3.2-3.2V8A3.2 3.2 0 0 0 16 4.8ZM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8Zm4.35-2.55a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9Z" />
      </SocialIcon>
    ),
  },
  {
    label: "YouTube",
    href: "",
    icon: (
      <SocialIcon>
        <path d="M21 8.2a3 3 0 0 0-2.1-2.1C17.2 5.7 12 5.7 12 5.7s-5.2 0-6.9.4A3 3 0 0 0 3 8.2 31.6 31.6 0 0 0 2.6 12 31.6 31.6 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.7.4 6.9.4 6.9.4s5.2 0 6.9-.4a3 3 0 0 0 2.1-2.1 31.6 31.6 0 0 0 .4-3.8 31.6 31.6 0 0 0-.4-3.8ZM10.4 14.8V9.2L15.2 12l-4.8 2.8Z" />
      </SocialIcon>
    ),
  },
]

const directory = [
  { href: "/specialisti", label: "Специалисти" },
  { href: "/zavedenia", label: "Здравни заведения" },
  { href: "/search", label: "Търсене" },
  { href: "/claim", label: "Заяви профил" },
]

const reading = [
  { href: "/articles", label: "Всички статии" },
  { href: "/articles?category=simptomi", label: "Симптоми и състояния" },
  { href: "/articles?category=izsledvania", label: "Изследвания и подготовка" },
  { href: "/articles?category=detsko-zdrave", label: "Детско здраве" },
  { href: "/articles?category=jensko-zdrave", label: "Женско здраве" },
  { href: "/articles?category=psihichno-zdrave", label: "Психично здраве" },
  { href: "/articles?category=predi-pregled", label: "Съвети преди преглед" },
]

const about = [
  { href: "/za-nas", label: "За нас" },
  { href: "/kontakti", label: "Контакти" },
  { href: "/obshti-usloviya", label: "Общи условия" },
  { href: "/politika-za-poveritelnost", label: "Поверителност" },
  { href: "/biskvitki", label: "Бисквитки" },
  { href: "/otgovornost", label: "Отговорност" },
]

const linkClass =
  "rounded-lg py-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 flex flex-col gap-1">
        {links.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={linkClass}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Footer() {
  const year = new Date().getFullYear()
  const profiles = social.filter((item) => item.href)

  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-[#F8FAFC]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-4">
        <div className="max-w-sm">
          <Link
            href="/"
            className="flex items-center gap-2.5 leading-none focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <LogoMark />
            <span className="flex flex-col">
              <span className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                Здравен
              </span>
              <span className="text-lg font-semibold tracking-tight text-primary">справочник</span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Справочник на лекари и здравни заведения в България. Търсене по специалност и град.
            Специалистите могат да заявят и управляват профила си.
          </p>
          <ul className="mt-4 flex gap-2">
            {profiles.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-white/80 text-primary transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {item.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Column title="Справочник" links={directory} />
        <Column title="Полезно" links={reading} />
        <Column title="За нас" links={about} />
      </div>
      <div className="border-t border-slate-200/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
          <p className="text-sm text-muted-foreground">© {year} Здравен справочник · Calma Life</p>
          <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
            Здравен справочник е информационен справочник, а не медицинска услуга. Не поставяме диагноза,
            не предписваме лечение и не препоръчваме конкретен специалист или заведение. Данните могат да са
            непълни или остарели. При оплаквания се обърнете към лекар, а при спешност — към 112.{" "}
            <Link href="/otgovornost" className="font-medium text-primary underline-offset-4 hover:underline">
              Повече
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
