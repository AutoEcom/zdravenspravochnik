import Link from "next/link"
import { Menu, Search } from "lucide-react"

const nav = [
  { href: "/search", label: "Специалисти" },
  { href: "/search?kind=facility", label: "Заведения" },
  { href: "/#statii", label: "Статии" },
]

const linkClass =
  "rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

export function Header() {
  return (
    <header className="sticky top-0 z-50">
      <div className="glass rounded-none">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4">
          <Link
            href="/"
            className="shrink-0 text-base font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="text-primary">Здравен</span> справочник
          </Link>

          <form action="/search" className="hidden min-w-0 flex-1 md:block md:max-w-sm">
            <label className="sr-only" htmlFor="header-search">
              Търсене
            </label>
            <input
              id="header-search"
              name="q"
              type="search"
              placeholder="Лекар, специалност или град"
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm outline-none transition-colors duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </form>

          <nav className="ml-auto hidden items-center gap-1 sm:flex" aria-label="Основна">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/search"
            className="ml-auto inline-flex size-11 items-center justify-center rounded-xl text-foreground transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:ml-0 md:hidden"
            aria-label="Търсене"
          >
            <Search className="size-5" />
          </Link>

          <details className="relative sm:hidden">
            <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Меню</span>
              <Menu className="size-5" />
            </summary>
            <nav
              className="glass absolute right-0 z-50 mt-2 grid w-56 gap-1 rounded-2xl p-2"
              aria-label="Мобилна"
            >
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
