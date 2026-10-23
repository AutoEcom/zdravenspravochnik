import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

import { absoluteUrl } from "@/lib/site"
import type { Database } from "@/lib/supabase/types"

const staticPaths = ["/", "/specialisti", "/zavedenia", "/articles", "/search", "/jensko-zdrave", "/za-nas", "/kontakti"]

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function publishedPaths(table: "doctors" | "facilities" | "articles", prefix: string) {
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [doctors, facilities, articles] = await Promise.all([
    publishedPaths("doctors", "/"),
    publishedPaths("facilities", "/"),
    publishedPaths("articles", "/articles/"),
  ])

  const seen = new Set<string>()
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }))
  for (const path of staticPaths) seen.add(path)

  for (const item of [...doctors, ...facilities, ...articles]) {
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
