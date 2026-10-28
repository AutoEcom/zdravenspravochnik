import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

import { isLegacyArticle } from "@/lib/content/article-path"
import { absoluteUrl } from "@/lib/site"
import type { Database } from "@/lib/supabase/types"

const staticPaths = [
  "/",
  "/specialisti",
  "/zavedenia",
  "/articles",
  "/search",
  "/jensko-zdrave",
  "/za-nas",
  "/kontakti",
  "/obshti-usloviya",
  "/politika-za-poveritelnost",
  "/biskvitki",
  "/otgovornost",
]

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function publishedPaths(table: "doctors" | "facilities", prefix: string) {
  const supabase = publicClient()
  if (!supabase) return []
  const paths: { path: string; updated?: string }[] = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("slug, updated_at")
      .eq("status", "published")
      .range(from, from + pageSize - 1)
    if (error || !data?.length) break
    for (const row of data) {
      if (row.slug) paths.push({ path: `${prefix}${row.slug}`, updated: row.updated_at })
    }
    if (data.length < pageSize) break
    from += pageSize
  }

  return paths
}

async function articlePaths() {
  const supabase = publicClient()
  if (!supabase) return []
  const paths: { path: string; updated?: string }[] = []
  const pageSize = 1000
  let from = 0
  const probe = await supabase.from("articles").select("source").limit(1)
  const withSource = !probe.error

  while (true) {
    const listed = withSource
      ? await supabase.from("articles").select("slug, updated_at, source").eq("status", "published").range(from, from + pageSize - 1)
      : await supabase.from("articles").select("slug, updated_at").eq("status", "published").range(from, from + pageSize - 1)
    if (listed.error || !listed.data?.length) break
    for (const row of listed.data) {
      if (!row.slug) continue
      const source = "source" in row && typeof row.source === "string" ? row.source : null
      const slug = encodeURIComponent(row.slug)
      paths.push({
        path: isLegacyArticle(source) ? `/${slug}` : `/articles/${slug}`,
        updated: row.updated_at,
      })
    }
    if (listed.data.length < pageSize) break
    from += pageSize
  }

  return paths
}

async function categoryPaths() {
  const supabase = publicClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from("article_categories")
    .select("slug, updated_at")
    .eq("is_published", true)
  if (error || !data?.length) return []
  return data.flatMap((row) =>
    row.slug ? [{ path: `/articles/category/${row.slug}`, updated: row.updated_at }] : []
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [doctors, facilities, articles, categories] = await Promise.all([
    publishedPaths("doctors", "/"),
    publishedPaths("facilities", "/"),
    articlePaths(),
    categoryPaths(),
  ])

  const seen = new Set<string>()
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }))
  for (const path of staticPaths) seen.add(path)

  for (const item of [...categories, ...doctors, ...facilities, ...articles]) {
    if (seen.has(item.path)) continue
    seen.add(item.path)
    entries.push({
      url: absoluteUrl(item.path),
      lastModified: item.updated ? new Date(item.updated) : undefined,
      changeFrequency: "weekly",
      priority: item.path.startsWith("/articles/") ? 0.6 : 0.5,
    })
  }

  return entries
}

export const revalidate = 3600
