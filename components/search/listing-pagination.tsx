import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { PAGE_SIZE, pageCount, withPage } from "@/lib/content/listing"

function pageItems(page: number, pages: number) {
  const raw = [1, page - 1, page, page + 1, pages]
    .filter((item, index, all) => item >= 1 && item <= pages && all.indexOf(item) === index)
    .sort((left, right) => left - right)
  const items: Array<number | "…"> = []
  for (const item of raw) {
    const previous = items[items.length - 1]
    if (typeof previous === "number" && item - previous > 1) items.push("…")
    items.push(item)
  }
  return items
}

export function ListingPagination({
  page,
  total,
  path,
  params,
  pageSize = PAGE_SIZE,
}: {
  page: number
  total: number
  path: string
  params: Record<string, string | undefined>
  pageSize?: number
}) {
  const pages = pageCount(total, pageSize)
  if (total <= pageSize) return null
  const items = pageItems(page, pages)

  return (
    <nav aria-label="Страници" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm tabular-nums text-muted-foreground">
        Страница {page} от {pages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <Link href={withPage(path, params, page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Назад
          </Link>
        ) : (
          <span className={buttonVariants({ variant: "outline", size: "sm", className: "pointer-events-none opacity-40" })}>
            Назад
          </span>
        )}
        {items.map((item, index) =>
          item === "…" ? (
            <span key={`gap-${index}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={withPage(path, params, item)}
              aria-current={item === page ? "page" : undefined}
              className={buttonVariants({
                variant: item === page ? "primary" : "outline",
                size: "sm",
                className: "min-w-10",
              })}
            >
              {item}
            </Link>
          ),
        )}
        {page < pages ? (
          <Link href={withPage(path, params, page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Напред
          </Link>
        ) : (
          <span className={buttonVariants({ variant: "outline", size: "sm", className: "pointer-events-none opacity-40" })}>
            Напред
          </span>
        )}
      </div>
    </nav>
  )
}
