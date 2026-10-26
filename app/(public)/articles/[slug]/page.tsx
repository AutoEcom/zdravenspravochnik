import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ArticleView } from "@/components/articles/article-view"
import { JsonLd } from "@/components/seo/json-ld"
import { createPageMetadata } from "@/components/seo/page-meta"
import { articleJsonLd, breadcrumbJsonLd } from "@/components/seo/schemas"
import { articleOgImage } from "@/lib/content/slug"
import { getArticleBySlug, getRelatedArticles } from "@/lib/supabase/queries"
import { siteConfig } from "@/lib/site"

function normalizeSlug(slug: string) {
  try {
    return decodeURIComponent(slug).normalize("NFC")
  } catch {
    return slug.normalize("NFC")
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const slug = normalizeSlug((await params).slug)
  const article = await getArticleBySlug(slug).catch(() => null)
  if (!article) {
    return createPageMetadata({
      title: "Страницата не е намерена",
      description: "Материалът не е публикуван или адресът е променен.",
      path: `/articles/${slug}`,
      index: false,
    })
  }

  const title = article.meta_title?.trim() || article.title
  const description =
    article.meta_description?.trim() || article.excerpt || article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
  const image = articleOgImage(article)
  const path = `/articles/${article.slug}`

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

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = normalizeSlug((await params).slug)
  const article = await getArticleBySlug(slug).catch(() => null)
  if (!article) notFound()

  const image = articleOgImage(article)
  const related = await getRelatedArticles(article.slug).catch(() => [])

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd(article, image),
          breadcrumbJsonLd([
            { name: "Начало", path: "/" },
            { name: "Полезно", path: "/articles" },
            { name: article.title, path: `/articles/${article.slug}` },
          ]),
        ]}
      />
      <ArticleView article={article} related={related} />
    </>
  )
}
