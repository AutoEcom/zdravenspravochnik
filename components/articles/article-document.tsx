import type { Metadata } from "next"

import { ArticleView } from "@/components/articles/article-view"
import { JsonLd } from "@/components/seo/json-ld"
import { createPageMetadata } from "@/components/seo/page-meta"
import { articleJsonLd, breadcrumbJsonLd } from "@/components/seo/schemas"
import { getSessionProfile } from "@/lib/auth/session"
import { articlePublicPath } from "@/lib/content/article-path"
import { articleOgImage } from "@/lib/content/slug"
import { getArticleCatalog, getRelatedArticles } from "@/lib/supabase/queries"
import type { Article } from "@/types/database"

export function articlePageMetadata(article: Article): Metadata {
  const title = article.meta_title?.trim() || article.title
  const description =
    article.meta_description?.trim() ||
    article.excerpt ||
    article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
  const image = articleOgImage(article)
  const path = articlePublicPath(article)
  const metadata = createPageMetadata({
    title,
    description,
    path,
    image,
    absoluteTitle: Boolean(article.meta_title?.trim()),
    type: "article",
  })

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
    },
  }
}

export async function ArticleDocument({ article }: { article: Article }) {
  const image = articleOgImage(article)
  const catalog = await getArticleCatalog().catch(() => [])
  const category = article.category_id ? (catalog.find((item) => item.id === article.category_id) ?? null) : null
  const [{ profile }, related] = await Promise.all([
    getSessionProfile(),
    getRelatedArticles(article.slug, category?.id ?? article.category_id).catch(() => []),
  ])
  const editHref = profile?.role === "admin" ? `/admin/articles/${article.id}/edit` : null
  const path = articlePublicPath(article)
  const crumbs = [
    { name: "Начало", path: "/" },
    { name: "Полезно", path: "/articles" },
    ...(category ? [{ name: category.name, path: `/articles/category/${category.slug}` }] : []),
    { name: article.title, path },
  ]

  return (
    <>
      <JsonLd data={[articleJsonLd(article, image, category?.name), breadcrumbJsonLd(crumbs)]} />
      <ArticleView article={article} category={category} related={related} editHref={editHref} />
    </>
  )
}
