import type { Metadata } from "next"

import { ArticleView } from "@/components/articles/article-view"
import { JsonLd } from "@/components/seo/json-ld"
import { createPageMetadata } from "@/components/seo/page-meta"
import { articleJsonLd, breadcrumbJsonLd } from "@/components/seo/schemas"
import { articlePublicPath } from "@/lib/content/article-path"
import { articleOgImage } from "@/lib/content/slug"
import { getArticleCatalog, getRelatedArticles } from "@/lib/supabase/queries"
import { siteConfig } from "@/lib/site"
import type { Article } from "@/types/database"

export function articlePageMetadata(article: Article): Metadata {
  const title = article.meta_title?.trim() || article.title
  const description =
    article.meta_description?.trim() ||
    article.excerpt ||
    article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
  const image = articleOgImage(article)
  const path = articlePublicPath(article)

  return {
    ...createPageMetadata({
      title,
      description,
      path,
      image,
      absoluteTitle: Boolean(article.meta_title?.trim()),
    }),
    openGraph: {
      title,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: "bg_BG",
      type: "article",
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      images: image ? [{ url: image, alt: article.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export async function ArticleDocument({ article }: { article: Article }) {
  const image = articleOgImage(article)
  const catalog = await getArticleCatalog().catch(() => [])
  const category = article.category_id ? (catalog.find((item) => item.id === article.category_id) ?? null) : null
  const related = await getRelatedArticles(article.slug, category?.id ?? article.category_id).catch(() => [])
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
      <ArticleView article={article} category={category} related={related} />
    </>
  )
}
