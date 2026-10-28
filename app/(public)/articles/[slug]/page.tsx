import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

import { ArticleDocument, articlePageMetadata } from "@/components/articles/article-document"
import { createPageMetadata } from "@/components/seo/page-meta"
import { isLegacyArticle } from "@/lib/content/article-path"
import { getArticleBySlug } from "@/lib/supabase/queries"

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

  return articlePageMetadata(article)
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = normalizeSlug((await params).slug)
  const article = await getArticleBySlug(slug).catch(() => null)
  if (!article) notFound()
  if (isLegacyArticle(article.source)) permanentRedirect(`/${encodeURIComponent(article.slug)}`)
  return <ArticleDocument article={article} />
}
