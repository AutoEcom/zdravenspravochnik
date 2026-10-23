import type { Article } from "@/types/database"

import { createClient } from "@/lib/supabase/server"

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
