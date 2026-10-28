import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ArticleBreadcrumb } from "@/components/articles/article-breadcrumb"
import { ArticleCard } from "@/components/articles/article-card"
import { CategoryNav } from "@/components/articles/category-nav"
import { JsonLd } from "@/components/seo/json-ld"
import { createPageMetadata } from "@/components/seo/page-meta"
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/components/seo/schemas"
import { ListingPagination } from "@/components/search/listing-pagination"
import { articleAccent, articlesInTopic, topicDisplayCount } from "@/lib/content/article-category"
import { articlePublicPath } from "@/lib/content/article-path"
import { parsePage, withPage } from "@/lib/content/listing"
import {
  ARTICLE_PAGE_SIZE,
  getArticleCatalog,
  getCategoryBySlug,
  getPublishedArticlesPage,
  getPublishedCountsByCategory,
} from "@/lib/supabase/queries"

function normalizeSlug(slug: string) {
  try {
    return decodeURIComponent(slug).normalize("NFC")
  } catch {
    return slug.normalize("NFC")
  }
}

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const slug = normalizeSlug((await params).slug)
  const page = parsePage((await searchParams).page)
  const category = await getCategoryBySlug(slug).catch(() => null)
  if (!category) {
    return createPageMetadata({
      title: "Страницата не е намерена",
      description: "Категорията не е публикувана или адресът е променен.",
      path: `/articles/category/${slug}`,
      index: false,
    })
  }

  const description = category.description?.trim() || `Материали в тема „${category.name}“.`
  return createPageMetadata({
    title: page > 1 ? `${category.name} — страница ${page}` : category.name,
    description,
    path: withPage(`/articles/category/${category.slug}`, {}, page),
    index: page === 1,
  })
}

export default async function ArticleCategoryPage({ params, searchParams }: PageProps) {
  const slug = normalizeSlug((await params).slug)
  const page = parsePage((await searchParams).page)
  const category = await getCategoryBySlug(slug).catch(() => null)
  if (!category) notFound()

  const [catalog, listing, counts] = await Promise.all([
    getArticleCatalog().catch(() => []),
    getPublishedArticlesPage(page, category.id).catch(() => ({ rows: [], total: 0 })),
    getPublishedCountsByCategory().catch((): Record<string, number> => ({})),
  ])
  const byId = new Map(catalog.map((item) => [item.id, item]))
  const accent = articleAccent(category.color_accent)
  const description = category.description?.trim() || `Материали в тема „${category.name}“.`
  const path = withPage(`/articles/category/${category.slug}`, {}, page)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-14">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Начало", path: "/" },
            { name: "Полезно", path: "/articles" },
            { name: category.name, path: `/articles/category/${category.slug}` },
          ]),
          collectionPageJsonLd({
            name: category.name,
            description,
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
      <ArticleBreadcrumb
        items={[
          { name: "Начало", href: "/" },
          { name: "Полезно", href: "/articles" },
          { name: category.name },
        ]}
      />
      <header className="max-w-[65ch] border-t-2 pt-5" style={{ borderColor: accent }}>
        <h1>{category.name}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{description}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {articlesInTopic(topicDisplayCount(category.slug, counts[category.id] ?? 0))}
        </p>
      </header>
      <CategoryNav categories={catalog} activeSlug={category.slug} counts={counts} />
      {listing.rows.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listing.rows.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} category={article.category_id ? (byId.get(article.category_id) ?? category) : category} />
            </li>
          ))}
        </ul>
      ) : null}
      <ListingPagination
        page={page}
        total={listing.total}
        path={`/articles/category/${category.slug}`}
        params={{}}
        pageSize={ARTICLE_PAGE_SIZE}
      />
    </main>
  )
}
