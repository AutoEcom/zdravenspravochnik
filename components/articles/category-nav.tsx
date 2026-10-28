import type { ReactNode } from "react"
import Link from "next/link"
import { LayoutGrid } from "lucide-react"

import { CategoryIcon } from "@/components/articles/category-icon"
import { accentTint, articleAccent, topicDisplayCount, topicsDisplayTotal } from "@/lib/content/article-category"
import { formatCount } from "@/lib/content/listing"
import type { PublicCategory } from "@/lib/supabase/queries/articles"

function Chip({
  href,
  label,
  count,
  accent,
  active,
  icon,
}: {
  href: string
  label: string
  count: number
  accent: string
  active: boolean
  icon: ReactNode
}) {
  return (
    <li className="flex snap-start">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className="flex h-full w-40 shrink-0 flex-col rounded-2xl border p-3 shadow-sm backdrop-blur-xl transition-colors duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        style={{
          backgroundColor: accentTint(accent, active ? 0.16 : 0.07),
          borderColor: active ? accent : accentTint(accent, 0.22),
        }}
      >
        <span className="flex items-start gap-2 text-sm font-medium">
          <span className="mt-0.5 shrink-0" style={{ color: accent }}>
            {icon}
          </span>
          <span className="line-clamp-2 min-w-0 flex-1 leading-snug text-foreground">{label}</span>
        </span>
        <span className="mt-auto pt-3">
          <span
            className="inline-flex h-6 w-fit items-center rounded-full px-2.5 text-xs font-semibold tabular-nums"
            style={{ color: accent, backgroundColor: accentTint(accent, active ? 0.2 : 0.14) }}
          >
            {formatCount(count)}
          </span>
        </span>
      </Link>
    </li>
  )
}

export function CategoryNav({
  categories,
  activeSlug = null,
  counts = {},
}: {
  categories: PublicCategory[]
  activeSlug?: string | null
  counts?: Record<string, number>
}) {
  const total = topicsDisplayTotal(categories, counts)

  return (
    <nav aria-label="Теми" className="-mx-4 px-4">
      <ul className="flex items-stretch snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        <Chip
          href="/articles"
          label="Всички"
          count={total}
          accent="#0F766E"
          active={!activeSlug}
          icon={<LayoutGrid className="size-4 shrink-0" aria-hidden />}
        />
        {categories.map((category) => {
          const accent = articleAccent(category.color_accent)
          return (
            <Chip
              key={category.id}
              href={`/articles/category/${category.slug}`}
              label={category.name}
              count={topicDisplayCount(category.slug, counts[category.id] ?? 0)}
              accent={accent}
              active={category.slug === activeSlug}
              icon={<CategoryIcon slug={category.slug} className="size-4 shrink-0" />}
            />
          )
        })}
      </ul>
    </nav>
  )
}
