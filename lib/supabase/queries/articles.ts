import type { Article } from "@/types/database"

import { articleCover } from "@/lib/content/slug"
import { createClient } from "@/lib/supabase/server"

export type RelatedArticle = {
  id: string
  slug: string
  title: string
  cover: string | null
}

export const ARTICLE_PAGE_SIZE = 12

export async function getPublishedArticles(limit = 3): Promise<Article[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getPublishedArticlesPage(page: number): Promise<{ rows: Article[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * ARTICLE_PAGE_SIZE
  const to = from + ARTICLE_PAGE_SIZE - 1
  const { data, error, count } = await supabase
    .from("articles")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to)

  if (error) throw error
  return { rows: data ?? [], total: count ?? 0 }
}

export async function getRelatedArticles(slug: string, limit = 6): Promise<RelatedArticle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .neq("slug", slug)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    cover: articleCover(article),
  }))
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}
