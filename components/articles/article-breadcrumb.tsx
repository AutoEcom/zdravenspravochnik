import Link from "next/link"

export function ArticleBreadcrumb({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Навигация">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {item.href && !last ? (
                <Link href={item.href} className="rounded-md py-1 hover:text-foreground">
                  {item.name}
                </Link>
              ) : (
                <span className={last ? "text-foreground" : undefined} aria-current={last ? "page" : undefined}>
                  {item.name}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
