import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { cleanContent, decodeEntities, decodeSlug, plainText, readCsv } from "./import-wp-sample"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const ARTICLE_ROOTS = new Set(["1"])
const PROFILE_ROOTS = ["982", "38", "29", "11"]
const CONTENT_MAX = 50000

type Term = { id: string; name: string; slug: string; parent: string }

function loadEnvFile(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "")
  }
}

function descendants(children: Map<string, Term[]>, rootId: string) {
  const ids = new Set<string>()
  const stack = [rootId]
  while (stack.length) {
    const id = stack.pop()
    if (!id || ids.has(id)) continue
    ids.add(id)
    for (const child of children.get(id) ?? []) stack.push(child.id)
  }
  return ids
}

function isArticleName(name: string) {
  const value = name.trim().toLocaleLowerCase("bg")
  return value === "полезно" || value === "полезни съвети" || value === "статии" || value === "статия"
}

function publishedAt(value: string) {
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/)
  if (!match) return new Date().toISOString()
  const date = new Date(`${match[1]}T${match[2]}+02:00`)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function articleSlug(raw: string) {
  return decodeSlug(raw)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
}

function stripCover(html: string, cover: string | null) {
  if (!cover) return html
  const escaped = cover.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return html.replace(new RegExp(`<img\\b[^>]*src=["']${escaped}["'][^>]*>`, "i"), "").trim()
}

async function existingSlugs(supabase: SupabaseClient) {
  const slugs = new Set<string>()
  let from = 0
  while (true) {
    const { data, error } = await supabase.from("articles").select("slug").range(from, from + 999)
    if (error) throw error
    if (!data?.length) break
    for (const row of data) if (row.slug) slugs.add(row.slug)
    if (data.length < 1000) break
    from += 1000
  }
  return slugs
}

type Row = Record<string, unknown>

async function insertBatch(supabase: SupabaseClient, rows: Row[], columns: Set<string>) {
  const payload = rows.map((row) => {
    const next: Row = {}
    for (const [key, value] of Object.entries(row)) {
      if (columns.has(key)) next[key] = value
    }
    return next
  })
  const { error } = await supabase.from("articles").insert(payload)
  if (!error) return columns
  const missing = error.message.match(/'([a-z_]+)' column|column "([a-z_]+)"/i)
  const column = missing?.[1] || missing?.[2]
  if (column && columns.has(column)) {
    columns.delete(column)
    console.log(`Колоната ${column} липсва. Пуснете supabase/migrations/006_articles_seo.sql. Продължавам без нея.`)
    return insertBatch(supabase, rows, columns)
  }
  throw error
}

async function main() {
  loadEnvFile(path.join(root, ".env.local"))
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Липсват NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в .env.local")

  const terms = readCsv("terms.csv").map((row) => ({
    id: row[0]?.trim() ?? "",
    name: decodeEntities(row[1] ?? "").replace(/\s+/g, " ").trim(),
    slug: decodeSlug(row[2] ?? ""),
    parent: row[4]?.trim() || "0",
    taxonomy: row[3]?.trim() ?? "",
  }))
  const categories = terms.filter((term) => term.taxonomy === "category" && term.id)
  const byId = new Map(categories.map((term) => [term.id, term]))
  const children = new Map<string, Term[]>()
  for (const term of categories) {
    const list = children.get(term.parent) ?? []
    list.push(term)
    children.set(term.parent, list)
  }

  const articleIds = new Set<string>()
  for (const id of ARTICLE_ROOTS) for (const child of descendants(children, id)) articleIds.add(child)
  for (const term of categories) {
    if (isArticleName(term.name)) for (const child of descendants(children, term.id)) articleIds.add(child)
  }
  const profileIds = new Set<string>()
  for (const id of PROFILE_ROOTS) for (const child of descendants(children, id)) profileIds.add(child)

  const termsByPost = new Map<string, string[]>()
  for (const row of readCsv("term_relationships.csv")) {
    const postId = row[0]?.trim()
    const termId = row[2]?.trim()
    if (!postId || !termId) continue
    const list = termsByPost.get(postId) ?? []
    list.push(termId)
    termsByPost.set(postId, list)
  }

  const seen = new Set<string>()
  const rows: Row[] = []
  let skippedProfile = 0
  let skippedShort = 0
  let skippedSlug = 0

  for (const row of readCsv("posts.csv")) {
    const id = row[0]?.trim() ?? ""
    const status = row[5] ?? ""
    const type = row[6] ?? ""
    if (status !== "publish" || type !== "post" || !id || seen.has(id)) continue
    const termIds = termsByPost.get(id) ?? []
    if (!termIds.some((termId) => articleIds.has(termId))) continue
    // Полезно posts are articles only. import-wp-full skips the same categories and does not create profiles.
    if (termIds.some((termId) => profileIds.has(termId))) {
      skippedProfile++
      continue
    }
    const title = decodeEntities(row[1] ?? "").replace(/\s+/g, " ").trim()
    const slug = articleSlug(row[2] ?? "")
    if (!title || !slug) {
      skippedSlug++
      continue
    }
    const cleaned = cleanContent(row[3] ?? "", CONTENT_MAX)
    const text = plainText(cleaned.text)
    if (text.length < 80) {
      skippedShort++
      continue
    }
    const excerptSource = plainText(row[4] ?? "") || text
    const cover = cleaned.images[0] ?? null
    seen.add(id)
    rows.push({
      title: title.slice(0, 180),
      slug,
      excerpt: excerptSource.slice(0, 500),
      content: stripCover(cleaned.text, cover),
      cover_url: cover,
      cover_image_url: cover,
      status: "published",
      source: "legacy_wp",
      published_at: publishedAt(row[7] ?? ""),
    })
  }

  const unique = new Map<string, Row>()
  for (const row of rows) {
    const slug = String(row.slug)
    if (!unique.has(slug)) unique.set(slug, row)
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const taken = await existingSlugs(supabase)
  const fresh = [...unique.values()].filter((row) => !taken.has(String(row.slug)))
  const duplicate = unique.size - fresh.length
  const columns = new Set([
    "title",
    "slug",
    "excerpt",
    "content",
    "cover_url",
    "cover_image_url",
    "status",
    "source",
    "published_at",
  ])

  for (let index = 0; index < fresh.length; index += 20) {
    await insertBatch(supabase, fresh.slice(index, index + 20), columns)
  }

  const legacySlugs = [...unique.keys()]
  let marked = false
  for (let index = 0; index < legacySlugs.length; index += 40) {
    const { error } = await supabase.from("articles").update({ source: "legacy_wp" }).in("slug", legacySlugs.slice(index, index + 40))
    if (error) {
      if (/source/.test(error.message)) break
      throw error
    }
    marked = true
  }

  console.log(`Кандидати статии: ${rows.length}`)
  console.log(`Пропуснати, защото са и профили: ${skippedProfile}`)
  console.log(`Пропуснати кратки: ${skippedShort}`)
  console.log(`Пропуснати без адрес: ${skippedSlug}`)
  console.log(`Вече съществуващи адреси: ${duplicate}`)
  console.log(`Импортирани legacy статии: ${fresh.length}`)
  console.log(marked ? "source=legacy_wp е записан." : "source не е записан, защото колоната още я няма.")
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirect) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
