import type { Metadata } from "next"
import Link from "next/link"

import { JsonLd } from "@/components/seo/json-ld"
import { createPageMetadata } from "@/components/seo/page-meta"
import { breadcrumbJsonLd } from "@/components/seo/schemas"
import { ListingPagination } from "@/components/search/listing-pagination"
import { GlassCard } from "@/components/ui/glass-card"
import { parsePage, withPage } from "@/lib/content/listing"
import { formatBgDate } from "@/lib/content/present"
import { articleCover } from "@/lib/content/slug"
import { ARTICLE_PAGE_SIZE, getPublishedArticlesPage } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const page = parsePage((await searchParams).page)
  return createPageMetadata({
    title: page > 1 ? `Полезно — страница ${page}` : "Полезно",
    description: "Кратки материали преди посещение при лекар или здравно заведение в България.",
    path: withPage("/articles", {}, page),
    index: page === 1,
  })
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const page = parsePage((await searchParams).page)
  const { rows, total } = await safeQuery(() => getPublishedArticlesPage(page), { rows: [], total: 0 })

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-14">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Начало", path: "/" },
          { name: "Полезно", path: "/articles" },
        ])}
      />
      <div className="max-w-2xl">
        <h1>Полезно</h1>
        <p className="mt-3 text-muted-foreground">
          Кратки материали, които помагат да се подготвите преди час при специалист.{" "}
          <Link href="/specialisti" className="text-primary underline underline-offset-4">
            Към специалистите
          </Link>
        </p>
      </div>
      {rows.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((article) => {
            const cover = articleCover(article)
            return (
              <li key={article.id}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <GlassCard variant="panel" className="flex h-full flex-col gap-3 transition-shadow duration-200 group-hover:shadow-md">
                    {cover ? (
                      <div className="aspect-video overflow-hidden rounded-xl bg-white/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cover} alt={article.title} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="glass flex aspect-video items-end rounded-xl p-4">
                        <span className="text-sm font-medium text-primary">Полезно</span>
                      </div>
                    )}
                    <h2 className="text-xl">{article.title}</h2>
                    {article.excerpt ? <p className="text-sm text-muted-foreground">{article.excerpt}</p> : null}
                    {article.published_at ? (
                      <time dateTime={article.published_at} className="mt-auto text-sm text-muted-foreground">
                        {formatBgDate(article.published_at)}
                      </time>
                    ) : null}
                  </GlassCard>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground">Все още няма публикувани материали.</p>
      )}
      <ListingPagination page={page} total={total} path="/articles" params={{}} pageSize={ARTICLE_PAGE_SIZE} />
    </main>
  )
}
