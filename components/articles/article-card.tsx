import Link from "next/link"

import { SponsoredBadge } from "@/components/articles/sponsored-badge"
import { articleAccent } from "@/lib/content/article-category"
import { articlePublicPath } from "@/lib/content/article-path"
import { formatBgDate } from "@/lib/content/present"
import { articleCover } from "@/lib/content/slug"
import type { ArticleListItem, PublicCategory } from "@/lib/supabase/queries/articles"
import { GlassCard } from "@/components/ui/glass-card"

export function ArticleCard({
  article,
  category,
  titleAs = "h2",
}: {
  article: ArticleListItem
  category?: PublicCategory | null
  titleAs?: "h2" | "p"
}) {
  const cover = articleCover(article)
  const accent = articleAccent(category?.color_accent)
  const Title = titleAs

  return (
    <Link
      href={articlePublicPath(article)}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <GlassCard variant="panel" className="flex h-full flex-col gap-3 transition-shadow duration-200 group-hover:shadow-md">
        <span className="h-1 w-12 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
        {cover ? (
          <div className="aspect-video overflow-hidden rounded-xl bg-white/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-video items-end rounded-xl bg-white/50 p-4">
            <span className="text-sm font-medium" style={{ color: accent }}>
              {category?.name ?? "Полезно"}
            </span>
          </div>
        )}
        {category || article.is_sponsored ? (
          <span className="flex flex-wrap items-center gap-2">
            {category ? (
              <span
                className="inline-flex w-fit items-center rounded-full border bg-white/80 px-2.5 py-1 text-xs font-medium"
                style={{ borderColor: accent, color: accent }}
              >
                {category.name}
              </span>
            ) : null}
            {article.is_sponsored ? <SponsoredBadge /> : null}
          </span>
        ) : null}
        <Title className="text-xl leading-snug">{article.title}</Title>
        <p className="line-clamp-3 min-h-[4.275rem] text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <time dateTime={article.published_at ?? undefined} className="mt-auto text-sm text-muted-foreground">
          {article.published_at ? formatBgDate(article.published_at) : "\u00a0"}
        </time>
      </GlassCard>
    </Link>
  )
}
