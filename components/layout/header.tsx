import { cache } from "react"
import Link from "next/link"
import { ChevronDown, Menu, Search } from "lucide-react"

import { CategoryIcon } from "@/components/articles/category-icon"
import { HeaderAuth } from "@/components/layout/header-auth"
import { LogoMark } from "@/components/layout/logo-mark"
import { SearchQueryField } from "@/components/search/search-query-field"
import { articleAccent } from "@/lib/content/article-category"
import { getArticleCatalog } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"
import type { PublicCategory } from "@/lib/supabase/queries/articles"

const headerSearchClass =
  "h-10 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm outline-none transition-colors duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"

const linkClass =
  "rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

const directory = [
  { href: "/specialisti", label: "Специалисти" },
  { href: "/zavedenia", label: "Здравни заведения" },
]

const readingCategories = cache(() => safeQuery(getArticleCatalog, [] as PublicCategory[]))

function ReadingList({ categories, compact = false }: { categories: PublicCategory[]; compact?: boolean }) {
  return (
    <ul className="grid gap-1">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            href={`/articles/category/${category.slug}`}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span style={{ color: articleAccent(category.color_accent) }}>
              <CategoryIcon slug={category.slug} />
            </span>
            <span className={compact ? "leading-snug" : "leading-snug font-medium"}>{category.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

async function DesktopReading() {
  const categories = await readingCategories()
  return (
    <details className="group relative">
      <summary className={`${linkClass} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}>
        Полезно
        <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div
        className="glass-strong absolute top-full right-0 z-50 mt-2 w-80 rounded-2xl border border-white/40 p-2 shadow-lg"
        style={{ backgroundColor: "rgba(255,255,255,0.96)" }}
      >
        <Link href="/articles" className={`${linkClass} block font-medium text-foreground`}>
          Всички теми
        </Link>
        {categories.length > 0 ? <ReadingList categories={categories} /> : null}
      </div>
    </details>
  )
}

async function MobileReading() {
  const categories = await readingCategories()
  return (
    <details className="group">
      <summary className={`${linkClass} flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden`}>
        Полезно
        <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-1 pb-1 pl-2">
        <Link href="/articles" className={linkClass}>
          Всички теми
        </Link>
        {categories.length > 0 ? <ReadingList categories={categories} compact /> : null}
      </div>
    </details>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50">
      <div className="glass rounded-none">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 leading-none focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <LogoMark />
            <span className="flex flex-col">
              <span className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                Здравен
              </span>
              <span className="text-lg font-semibold tracking-tight text-primary">справочник</span>
            </span>
          </Link>

          <form action="/search" className="hidden min-w-0 flex-1 md:block md:max-w-sm">
            <label className="sr-only" htmlFor="header-search">
              Търсене
            </label>
            <SearchQueryField
              id="header-search"
              placeholder="Лекар, специалност или град"
              inputClassName={headerSearchClass}
            />
          </form>

          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Основна">
            {directory.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ))}
            <DesktopReading />
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <HeaderAuth />
            <Link
              href="/search"
              className="inline-flex size-11 items-center justify-center rounded-xl text-foreground transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:hidden"
              aria-label="Търсене"
            >
              <Search className="size-5" />
            </Link>

            <details className="relative lg:hidden">
              <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
                <span className="sr-only">Меню</span>
                <Menu className="size-5" />
              </summary>
              <nav
                className="glass-strong absolute right-0 z-50 mt-2 grid max-h-[70vh] w-72 gap-1 overflow-y-auto rounded-2xl border border-white/40 p-2 shadow-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.96)" }}
                aria-label="Мобилна"
              >
                <form action="/search" className="p-1">
                  <label className="sr-only" htmlFor="menu-search">
                    Търсене
                  </label>
                  <SearchQueryField
                    id="menu-search"
                    placeholder="Лекар, специалност или град"
                    inputClassName={headerSearchClass}
                  />
                </form>
                {directory.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                ))}
                <MobileReading />
              </nav>
            </details>
          </div>
        </div>
      </div>
    </header>
  )
}
