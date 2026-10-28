import type { Metadata } from "next"
import { permanentRedirect } from "next/navigation"

import { ArticleCard } from "@/components/articles/article-card"
import { CategoryNav } from "@/components/articles/category-nav"
import { JsonLd } from "@/components/seo/json-ld"
import { createPageMetadata } from "@/components/seo/page-meta"
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/components/seo/schemas"
import { ListingPagination } from "@/components/search/listing-pagination"
import { categoriesLabel, categoryPathFromQuery, publishedArticlesLabel, topicsDisplayTotal } from "@/lib/content/article-category"
import { articlePublicPath } from "@/lib/content/article-path"
import { parsePage, withPage } from "@/lib/content/listing"
import {
  ARTICLE_PAGE_SIZE,
  getArticleCatalog,
  getArticleStats,
  getPublishedArticlesPage,
  getPublishedCountsByCategory,
} from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

type PageProps = {
  searchParams: Promise<{ page?: string; category?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const page = parsePage((await searchParams).page)
  return createPageMetadata({
    title: page > 1 ? `Полезно — страница ${page}` : "Полезно",
    description: "Материали по симптоми, изследвания, детско и женско здраве и подготовка за преглед.",
    path: withPage("/articles", {}, page),
    index: page === 1,
  })
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const legacy = categoryPathFromQuery(params.category)
  if (legacy) permanentRedirect(legacy)

  const page = parsePage(params.page)
  const [catalog, stats, listing, counts] = await Promise.all([
    safeQuery(getArticleCatalog, []),
    safeQuery(getArticleStats, { articleCount: 0, categoryCount: 0 }),
    safeQuery(() => getPublishedArticlesPage(page), { rows: [], total: 0 }),
    safeQuery(getPublishedCountsByCategory, {}),
  ])
  const byId = new Map(catalog.map((category) => [category.id, category]))
  const path = withPage("/articles", {}, page)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-14">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Начало", path: "/" },
            { name: "Полезно", path: "/articles" },
          ]),
          collectionPageJsonLd({
            name: "Полезно",
            description: "Материали по симптоми, изследвания, детско и женско здраве и подготовка за преглед.",
            path,
            total: listing.total,
            items: listing.rows.map((article, index) => ({
              name: article.title,
              path: articlePublicPath(article),
              position: (page - 1) * ARTICLE_PAGE_SIZE + index + 1,
            })),
          }),
        ]}
      />
      <div className="max-w-[65ch]">
        <h1>Полезно</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Материали, които помагат да се ориентирате преди преглед. Те не поставят диагноза и не заместват лекар.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {publishedArticlesLabel(topicsDisplayTotal(catalog, counts))} · {categoriesLabel(stats.categoryCount)}
        </p>
      </div>
      <CategoryNav categories={catalog} counts={counts} />
      {listing.rows.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listing.rows.map((article) => (
            <li key={article.id}>
              <ArticleCard
                article={article}
                category={article.category_id ? byId.get(article.category_id) : null}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Все още няма публикувани материали.</p>
      )}
      <ListingPagination page={page} total={listing.total} path="/articles" params={{}} pageSize={ARTICLE_PAGE_SIZE} />
    </main>
  )
}
