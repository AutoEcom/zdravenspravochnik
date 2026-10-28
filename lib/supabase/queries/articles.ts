import type { Article } from "@/types/database"

import { topicDisplayCount, topicsDisplayTotal } from "@/lib/content/article-category"
import { articleCover } from "@/lib/content/slug"
import { createClient } from "@/lib/supabase/server"

export type PublicCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  color_accent: string | null
  cover_image_url: string | null
  sort_order: number
}

export type ArticleListItem = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  published_at: string | null
  cover_url: string | null
  cover_image_url: string | null
  category_id: string | null
  source: string | null
}

export type RelatedArticle = {
  id: string
  slug: string
  title: string
  cover: string | null
  source: string | null
}

export type ReadingGroup = {
  category: PublicCategory
  total: number
  articles: ArticleListItem[]
}

export type ReadingDigest = {
  articleCount: number
  categoryCount: number
  groups: ReadingGroup[]
  latest: ArticleListItem[]
}

export const ARTICLE_PAGE_SIZE = 12

const HOME_SLUGS = ["jensko-zdrave", "detsko-zdrave", "simptomi-i-sastoyaniya", "saveti-predi-pregled"]

const listColumns = "id, slug, title, excerpt, published_at, cover_url, cover_image_url, category_id, source" as const

function toListItem(article: Article): ArticleListItem {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    published_at: article.published_at,
    cover_url: article.cover_url,
    cover_image_url: article.cover_image_url,
    category_id: article.category_id ?? null,
    source: article.source ?? null,
  }
}

export async function getPublishedArticles(limit = 3): Promise<Article[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getArticleCatalog(): Promise<PublicCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("article_categories")
    .select("id, name, slug, description, color_accent, cover_image_url, sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("article_categories")
    .select("id, name, slug, description, color_accent, cover_image_url, sort_order")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getArticleStats(): Promise<{ articleCount: number; categoryCount: number }> {
  const supabase = await createClient()
  const articles = await supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published")
  if (articles.error) throw articles.error
  const categories = await supabase
    .from("article_categories")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)

  return {
    articleCount: articles.count ?? 0,
    categoryCount: categories.error ? 0 : (categories.count ?? 0),
  }
}

export async function getPublishedArticlesPage(
  page: number,
  categoryId?: string
): Promise<{ rows: ArticleListItem[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * ARTICLE_PAGE_SIZE
  const to = from + ARTICLE_PAGE_SIZE - 1
  let query = supabase
    .from("articles")
    .select(listColumns, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })

  if (categoryId) query = query.eq("category_id", categoryId)

  const { data, error, count } = await query.range(from, to)
  if (error && !categoryId && /category_id|source/i.test(error.message)) {
    const fallback = await supabase
      .from("articles")
      .select("id, slug, title, excerpt, published_at, cover_url, cover_image_url", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, to)
    if (fallback.error) throw fallback.error
    return {
      rows: (fallback.data ?? []).map((article) => ({ ...article, category_id: null, source: null })),
      total: fallback.count ?? 0,
    }
  }
  if (error) throw error
  return { rows: data ?? [], total: count ?? 0 }
}

async function loadArticleList(
  supabase: Awaited<ReturnType<typeof createClient>>,
  options: { categoryId?: string | null; limit: number }
) {
  const base = () =>
    supabase
      .from("articles")
      .select(listColumns)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(options.limit)

  const filtered = options.categoryId ? base().eq("category_id", options.categoryId) : base()
  const first = await filtered
  if (!first.error) return first.data ?? []
  if (options.categoryId || !/category_id|source/i.test(first.error.message)) throw first.error

  const fallback = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, published_at, cover_url, cover_image_url")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(options.limit)
  if (fallback.error) throw fallback.error
  return (fallback.data ?? []).map((article) => ({ ...article, category_id: null, source: null }))
}

export async function getRelatedArticles(
  slug: string,
  categoryId: string | null,
  limit = 6
): Promise<RelatedArticle[]> {
  const supabase = await createClient()
  const mapRow = (article: ArticleListItem): RelatedArticle => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    cover: articleCover(article),
    source: article.source ?? null,
  })

  const primary = categoryId
    ? (await loadArticleList(supabase, { categoryId, limit: limit + 1 })).filter((item) => item.slug !== slug).slice(0, limit)
    : []
  if (primary.length >= limit) return primary.map(mapRow)

  const exclude = new Set([slug, ...primary.map((item) => item.slug)])
  const rest = (await loadArticleList(supabase, { limit: limit + exclude.size }))
    .filter((item) => !exclude.has(item.slug))
    .slice(0, limit - primary.length)
  return [...primary, ...rest].map(mapRow)
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getPublishedCountsByCategory() {
  const counts = await countPublishedByCategory()
  return Object.fromEntries(counts)
}

async function countPublishedByCategory() {
  const supabase = await createClient()
  const counts = new Map<string, number>()
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("articles")
      .select("category_id")
      .eq("status", "published")
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data?.length) break
    for (const row of data) {
      if (!row.category_id) continue
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1)
    }
    if (data.length < pageSize) break
    from += pageSize
  }

  return counts
}

export async function getReadingDigest(): Promise<ReadingDigest> {
  const stats = await getArticleStats()
  let categories: PublicCategory[] = []
  let counts = new Map<string, number>()
  try {
    categories = await getArticleCatalog()
    counts = await countPublishedByCategory()
  } catch {
    const latest = (await getPublishedArticles(3)).map(toListItem)
    return { ...stats, groups: [], latest }
  }

  const supabase = await createClient()
  const countRecord = Object.fromEntries(counts)
  const articleCount = topicsDisplayTotal(categories, countRecord)
  const withArticles = categories.filter((category) => (counts.get(category.id) ?? 0) > 0)
  const preferred = HOME_SLUGS.flatMap((slug) => {
    const match = withArticles.find((category) => category.slug === slug)
    return match ? [match] : []
  })
  const rest = withArticles.filter((category) => !HOME_SLUGS.includes(category.slug))
  const chosen = [...preferred, ...rest].slice(0, 4)

  if (chosen.length === 0) {
    const latest = (await getPublishedArticles(3)).map(toListItem)
    return { ...stats, articleCount, groups: [], latest }
  }

  const { data, error } = await supabase
    .from("articles")
    .select(listColumns)
    .eq("status", "published")
    .in(
      "category_id",
      chosen.map((category) => category.id)
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(40)

  if (error) {
    const latest = (await getPublishedArticles(3)).map(toListItem)
    return { ...stats, articleCount, groups: [], latest }
  }
  const rows = data ?? []
  const groups = chosen.map((category) => ({
    category,
    total: topicDisplayCount(category.slug, counts.get(category.id) ?? 0),
    articles: rows.filter((article) => article.category_id === category.id).slice(0, 2),
  }))

  return { ...stats, articleCount, groups, latest: [] }
}
