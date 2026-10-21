import type { Metadata } from "next"
import Link from "next/link"

import { JsonLd } from "@/components/seo/json-ld"
import { createPageMetadata } from "@/components/seo/page-meta"
import { breadcrumbJsonLd } from "@/components/seo/schemas"
import { GlassCard } from "@/components/ui/glass-card"
import { formatBgDate } from "@/lib/content/present"
import { getPublishedArticles } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

export const metadata: Metadata = createPageMetadata({
  title: "Полезно",
  description: "Кратки материали преди посещение при лекар или лечебно заведение в България.",
  path: "/articles",
})

export default async function ArticlesPage() {
  const articles = await safeQuery(() => getPublishedArticles(60), [])

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
          Кратки материали, които помагат да се подготвите преди час при специалист.
        </p>
      </div>
      {articles.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/articles/${article.slug}`}
                className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <GlassCard variant="panel" className="flex h-full flex-col gap-3 transition-shadow duration-200 group-hover:shadow-md">
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
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Все още няма публикувани материали.</p>
      )}
    </main>
  )
}
