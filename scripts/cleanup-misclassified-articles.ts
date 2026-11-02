import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function loadEnvFile(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "")
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("bg")
    .replace(/[«»„“”"'`.,()/\\+:;!?–—-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const boundary = String.raw`(?:^|[\s«"„(])`
const end = String.raw`(?:[\s»").,:-]|$)`
const hardMarkers = [
  new RegExp(`${boundary}д\\s*[-.]?\\s*р\\.?${end}`, "i"),
  new RegExp(`${boundary}проф\\.?${end}`, "i"),
  new RegExp(`${boundary}доц\\.?${end}`, "i"),
  /умбал|мбал|сбал|дкц|мдц/i,
  new RegExp(`${boundary}мц${end}`, "i"),
  /еоод/i,
  new RegExp(`${boundary}оод${end}`, "i"),
]
const softMarkers = [
  /лаборатор/i,
  /хоспис/i,
  /аптек/i,
  /трудова\s+медицина/i,
  /медицинско\s+оборудване/i,
  /медицински\s+център/i,
  /диагностично[\s-]*консултатив/i,
]

const guideMarkers = /как\s+да|какво\s+да|как\s+се|симптом|лечение|превенц|профилактик/i

const phoneMarker = /(?:\+359|0\d{2,3})[\s./-]?\d{2,3}[\s./-]?\d{2,4}|тел(?:ефон)?\s*[:.]/i

type ArticleRow = {
  id: string
  slug: string
  title: string
  content: string | null
  source: string | null
  status: string
}

type Decision = "skip" | "archive" | "needs-profile"

export function classifyArticle(
  article: ArticleRow,
  profiles: { slugs: Set<string>; names: Set<string> }
): Decision {
  if (article.source === "site" || article.status === "archived") return "skip"

  const title = article.title ?? ""
  const plain = stripHtml(article.content ?? "")
  const hardHit = hardMarkers.some((pattern) => pattern.test(title))
  const softHit = softMarkers.some((pattern) => pattern.test(title))
  const looksLikeGuide = guideMarkers.test(title)
  const shortWithPhone = plain.length > 0 && plain.length < 450 && phoneMarker.test(`${title}\n${plain}`)
  const slugHit = profiles.slugs.has(article.slug)
  const name = normalize(title)
  const nameHit = name.length >= 4 && profiles.names.has(name)
  const profileHit = slugHit || nameHit
  const orgHit = hardHit || (softHit && !looksLikeGuide)

  if (looksLikeGuide && !hardHit && !profileHit) return "skip"
  if (!orgHit && !shortWithPhone && !profileHit) return "skip"
  if (looksLikeGuide && !profileHit && !hardHit) return "skip"
  if (!profileHit) return "needs-profile"
  return "archive"
}

function assertClassifier() {
  const empty = { slugs: new Set<string>(), names: new Set<string>() }
  const guide = classifyArticle(
    { id: "1", slug: "kak-da", title: "Как да се подготвите за първи преглед", content: "Дълъг текст ".repeat(40), source: null, status: "published" },
    empty
  )
  const symptoms = classifyArticle(
    { id: "2", slug: "simptomi", title: "Симптоми при настинка", content: "Описание ".repeat(30), source: "legacy_wp", status: "published" },
    empty
  )
  const facility = classifyArticle(
    { id: "3", slug: "dkc-sofia", title: "ДКЦ Света София", content: "Тел. 02 123 4567", source: null, status: "published" },
    empty
  )
  const matched = classifyArticle(
    { id: "4", slug: "dkc-sofia", title: "ДКЦ Света София", content: "Адрес", source: "legacy_wp", status: "published" },
    { slugs: new Set(["dkc-sofia"]), names: new Set<string>() }
  )
  const manual = classifyArticle(
    { id: "5", slug: "dkc-note", title: "ДКЦ и какво да носите", content: "Ръчен текст", source: "site", status: "published" },
    empty
  )
  const labGuide = classifyArticle(
    { id: "6", slug: "lab", title: "Как да се подготвите за лабораторни изследвания", content: "Текст ".repeat(40), source: null, status: "published" },
    empty
  )
  const prevention = classifyArticle(
    { id: "7", slug: "prev", title: "Превенция и профилактика", content: "Текст ".repeat(20), source: null, status: "published" },
    empty
  )
  if (
    guide !== "skip" ||
    symptoms !== "skip" ||
    facility !== "needs-profile" ||
    matched !== "archive" ||
    manual !== "skip" ||
    labGuide !== "skip" ||
    prevention !== "skip"
  ) {
    throw new Error(`classifier: ${guide}, ${symptoms}, ${facility}, ${matched}, ${manual}, ${labGuide}, ${prevention}`)
  }
}

async function loadAll(supabase: SupabaseClient, table: string, columns: string) {
  const rows: Record<string, unknown>[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data?.length) break
    rows.push(...(data as unknown as Record<string, unknown>[]))
    if (data.length < 1000) break
    from += 1000
  }
  return rows
}

async function main() {
  assertClassifier()
  const dryRun = process.argv.includes("--dry-run")
  loadEnvFile(path.join(root, ".env.local"))
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Липсва NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY.")

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [articleRows, doctorRows, facilityRows] = await Promise.all([
    loadAll(supabase, "articles", "id, slug, title, content, source, status"),
    loadAll(supabase, "doctors", "slug, full_name, status"),
    loadAll(supabase, "facilities", "slug, name, status"),
  ])

  const profiles = { slugs: new Set<string>(), names: new Set<string>() }
  for (const row of doctorRows) {
    if (row.status !== "published") continue
    if (typeof row.slug === "string") profiles.slugs.add(row.slug)
    if (typeof row.full_name === "string") profiles.names.add(normalize(row.full_name))
  }
  for (const row of facilityRows) {
    if (row.status !== "published") continue
    if (typeof row.slug === "string") profiles.slugs.add(row.slug)
    if (typeof row.name === "string") profiles.names.add(normalize(row.name))
  }

  const archived: ArticleRow[] = []
  const needsProfile: ArticleRow[] = []
  for (const raw of articleRows) {
    const article: ArticleRow = {
      id: String(raw.id),
      slug: String(raw.slug ?? ""),
      title: String(raw.title ?? ""),
      content: typeof raw.content === "string" ? raw.content : null,
      source: typeof raw.source === "string" ? raw.source : null,
      status: String(raw.status ?? ""),
    }
    const decision = classifyArticle(article, profiles)
    if (decision === "needs-profile") {
      needsProfile.push(article)
      archived.push(article)
      console.log(`needs profile\t${article.slug}\t${article.title}`)
    } else if (decision === "archive") {
      archived.push(article)
    }
  }

  if (!dryRun && archived.length > 0) {
    for (let index = 0; index < archived.length; index += 100) {
      const ids = archived.slice(index, index + 100).map((article) => article.id)
      const { error } = await supabase.from("articles").update({ status: "archived" }).in("id", ids)
      if (error) throw new Error(error.message)
    }
  }

  console.log("")
  console.log(`${dryRun ? "dry-run" : "archived"}: ${archived.length}`)
  console.log(`needs profile: ${needsProfile.length}`)
  console.log("examples:")
  for (const article of archived.slice(0, 15)) {
    console.log(`- ${article.title} | ${article.slug}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
