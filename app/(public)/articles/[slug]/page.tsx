import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ArticleView } from "@/components/articles/article-view"
import { JsonLd } from "@/components/seo/json-ld"
import { createPageMetadata } from "@/components/seo/page-meta"
import { articleJsonLd, breadcrumbJsonLd } from "@/components/seo/schemas"
import { articleCover } from "@/lib/content/slug"
import { getArticleBySlug } from "@/lib/supabase/queries"
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

  const description = article.excerpt || article.content.slice(0, 160)
  const cover = articleCover(article)
  const path = `/articles/${article.slug}`

  return {
    ...createPageMetadata({
      title: article.title,
      description,
      path,
      image: cover,
    }),
    openGraph: {
      title: article.title,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: "bg_BG",
      type: "article",
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      images: cover ? [{ url: cover, alt: article.title }] : undefined,
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = normalizeSlug((await params).slug)
  const article = await getArticleBySlug(slug).catch(() => null)
  if (!article) notFound()

  const cover = articleCover(article)

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd(article, cover),
          breadcrumbJsonLd([
            { name: "Начало", path: "/" },
            { name: "Полезно", path: "/articles" },
            { name: article.title, path: `/articles/${article.slug}` },
          ]),
        ]}
      />
      <ArticleView article={article} />
    </>
  )
}
