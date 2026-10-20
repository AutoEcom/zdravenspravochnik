import Link from "next/link"

const links = [
  { href: "/", label: "Начало" },
  { href: "/search", label: "Специалисти" },
  { href: "/search?kind=facility", label: "Заведения" },
  { href: "/jensko-zdrave", label: "Женско здраве" },
  { href: "/#statii", label: "Статии" },
  { href: "/za-nas", label: "За нас" },
  { href: "/kontakti", label: "Контакти" },
  { href: "/login", label: "Вход" },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-8 border-t border-slate-200/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr]">
        <div className="max-w-md">
          <p className="flex flex-col leading-none">
            <span className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Здравен
            </span>
            <span className="text-lg font-semibold text-primary">справочник</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Справочник на лекари и лечебни заведения в България.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-2 text-sm" aria-label="Долна навигация">
          {links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg py-1 text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="px-4 pb-8 text-center text-sm text-muted-foreground">
        © {year} Здравен справочник
      </p>
    </footer>
  )
}
