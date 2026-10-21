import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const importDir = path.join(root, "data", "import")

const SPECIALISTS = "982"
const HOSPITALS = "38"
const CENTERS = "29"
const LABS = "11"

const LIMITS = {
  specialists: 22,
  hospitals: 14,
  centers: 12,
  labs: 8,
} as const

type Group = keyof typeof LIMITS
type FacilityType = "hospital" | "clinic" | "laboratory"

type Term = {
  id: string
  name: string
  slug: string
  parent: string
}

type Post = {
  id: string
  title: string
  slug: string
  html: string
  excerpt: string
  status: string
  type: string
}

type Candidate = {
  post: Post
  group: Group
  facilityType: FacilityType | null
  specialties: Term[]
  cities: Term[]
}

type Prepared = {
  kind: "doctor" | "facility"
  slug: string
  title: string
  phone: string | null
  email: string | null
  image: string | null
  row: Record<string, unknown>
}

function loadEnvFile(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "")
  }
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index++
      } else if (char === '"') quoted = false
      else field += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (char !== "\r") field += char
  }

  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function readCsv(file: string) {
  const rows = parseCsv(readFileSync(path.join(importDir, file), "utf8"))
  const [header, ...body] = rows
  if (!header) throw new Error(`Empty CSV: ${file}`)
  return body.filter((row) => row.some((cell) => cell.trim()))
}

function decodeSlug(value: string) {
  let current = value.trim()
  for (let pass = 0; pass < 2 && current.includes("%"); pass++) {
    try {
      const next = decodeURIComponent(current.replace(/\+/g, "%20"))
      if (next === current) break
      current = next
    } catch {
      break
    }
  }
  return current.normalize("NFC")
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => safeCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => safeCodePoint(Number.parseInt(code, 16)))
}

function safeCodePoint(code: number) {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return ""
  try {
    return String.fromCodePoint(code)
  } catch {
    return ""
  }
}

function absolutize(src: string) {
  const trimmed = decodeEntities(src).trim()
  if (!trimmed || trimmed.startsWith("data:")) return null
  if (trimmed.startsWith("//")) return `https:${trimmed}`
  if (trimmed.startsWith("/")) return `https://zdravenspravochnik.com${trimmed}`
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return null
}

function isOwnImage(url: string) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "")
    return host === "zdravenspravochnik.com" && parsed.pathname.startsWith("/wp-content/")
  } catch {
    return false
  }
}

function imagesFrom(html: string) {
  const urls: string[] = []
  const patterns = [/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi, /\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/gi]
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const url = absolutize(match[1] ?? "")
      if (url && isOwnImage(url) && !urls.includes(url)) urls.push(url)
    }
  }
  return urls
}

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
}

function plainText(html: string) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

function isBareUpload(value: string) {
  return /^https?:\/\/(?:www\.)?zdravenspravochnik\.com\/wp-content\/\S+$/i.test(value.trim())
}

function promoteShortcodeImages(html: string) {
  return html.replace(/\[(?:mk_image|vc_single_image|image|gallery)\b([^\]]*)\]/gi, (_, attrs: string) => {
    const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]
    const url = src ? absolutize(src) : null
    return url && isOwnImage(url) ? `<img src="${url}" alt="">` : ""
  })
}

function stripBuilderNoise(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<iframe\b[^>]*>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/\[(button|vc_btn|mk_button|mk_button_gradient)\b[^\]]*\][\s\S]*?\[\/\1\]/gi, "")
    .replace(/\[\/?(?:vc_gmaps|mk_map|googlemap|google_maps|map)\b[^\]]*\]/gi, "")
    .replace(/https?:\/\/(?:www\.)?(?:google\.[a-z.]+\/maps\S*|maps\.google\.\S+|maps\.googleapis\.com\S*)/gi, "")
    .replace(/\[\/?[a-z0-9_-]+(?:\s[^\]]*)?\]/gi, "")
    .replace(/<(span|div)\b[^>]*>\s*<\/\1>/gi, "")
    .replace(/<\/?(?:table|thead|tbody|tfoot|tr|td|th|colgroup|col)\b[^>]*>/gi, "\n")
}

function simplifyHtml(source: string) {
  let html = ""
  for (const part of source.split(/(<[^>]+>)/g)) {
    if (!part) continue
    if (!part.startsWith("<")) {
      const text = part.replace(/\r/g, "").replace(/[ \t\f\v]+/g, " ").replace(/[ \t]*\n[ \t]*/g, "\n")
      if (isBareUpload(text.trim())) continue
      html += escapeText(text)
      continue
    }

    const parsed = part.match(/^<\s*(\/)?\s*([a-z0-9]+)/i)
    if (!parsed) continue
    const closing = Boolean(parsed[1])
    const name = parsed[2].toLowerCase()

    if (name === "br") {
      html += "\n"
      continue
    }
    if (name === "hr") {
      html += "\n\n"
      continue
    }
    if (name === "img" && !closing) {
      const src = part.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]
      const url = src ? absolutize(src) : null
      if (url && isOwnImage(url)) html += `\n<img src="${escapeAttr(url)}" alt="">\n`
      continue
    }
    if (name === "b" || name === "strong") {
      html += closing ? "</strong>" : "<strong>"
      continue
    }
    if (name === "i" || name === "em") {
      html += closing ? "</em>" : "<em>"
      continue
    }
    if (name === "li") {
      html += closing ? "</li>" : "<li>"
      continue
    }
    if (name === "ul" || name === "ol") {
      html += closing ? `</${name}>\n\n` : `\n<${name}>`
      continue
    }
    if (/^h[1-6]$/.test(name)) {
      const level = name === "h1" ? "h2" : name === "h5" || name === "h6" ? "h4" : name
      html += closing ? `</${level}>\n\n` : `\n<${level}>`
      continue
    }
    if (name === "p" || name === "div" || name === "section" || name === "article" || name === "blockquote") {
      html += closing ? "\n\n" : "\n"
    }
  }
  return html.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n")
}

function pushParagraphs(chunks: string[], raw: string) {
  const pieces = raw.split(/\n{2,}|\s*[-–—_*]{3,}\s*(?=\n|$)/)
  for (const piece of pieces) {
    const line = piece.replace(/[ \t]*\n[ \t]*/g, "<br>").replace(/(?:<br>\s*){2,}/gi, "</p><p>").trim()
    if (!line) continue
    for (const paragraph of line.split("</p><p>")) {
      const value = paragraph.replace(/^(?:<br>\s*)+|(?:\s*<br>)+$/gi, "").trim()
      if (!value || isBareUpload(plainText(value))) continue
      chunks.push(`<p>${value}</p>`)
    }
  }
}

function readableHtml(source: string) {
  const simplified = simplifyHtml(source)
  const chunks: string[] = []
  const blocks = /<(ul|ol|h2|h3|h4)>[\s\S]*?<\/\1>|<img\b[^>]*>/gi
  let last = 0
  for (const match of simplified.matchAll(blocks)) {
    pushParagraphs(chunks, simplified.slice(last, match.index))
    const block = match[0].replace(/\s+/g, " ").replace(/>\s+</g, "><").trim()
    if (block && !isBareUpload(plainText(block))) chunks.push(block)
    last = (match.index ?? 0) + match[0].length
  }
  pushParagraphs(chunks, simplified.slice(last))

  const html = chunks
    .join("")
    .replace(/<li>\s*<\/li>/gi, "")
    .replace(/<(ul|ol)>\s*<\/\1>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<(strong|em)>\s*<\/\1>/gi, "")
    .trim()
  if (html.length <= 8000) return html
  const cut = html.slice(0, 8000)
  const end = cut.lastIndexOf(">")
  return (end > 0 ? cut.slice(0, end + 1) : cut).trim()
}

function cleanContent(html: string) {
  const prepared = promoteShortcodeImages(decodeEntities(html).replace(/\u00a0/g, " "))
  const stripped = stripBuilderNoise(prepared)
  const images = imagesFrom(`${prepared}\n${stripped}`)
  return { text: readableHtml(stripped), images }
}

function phonesFrom(text: string) {
  const phones: string[] = []
  const pattern = /(?:^|[^\d])((?:\+359|0)(?:[\s./()-]*\d){7,12})/g
  for (const match of text.matchAll(pattern)) {
    const raw = (match[1] ?? "").replace(/\s+/g, " ").trim()
    const digits = raw.replace(/\D/g, "")
    const valid = raw.startsWith("+359") ? digits.length >= 11 && digits.length <= 13 : digits.length >= 9 && digits.length <= 10
    if (!valid || phones.includes(raw)) continue
    phones.push(raw)
    if (phones.length === 2) break
  }
  return phones
}

function emailsFrom(text: string) {
  const normalized = text.replace(/\(\s*@\s*\)|\[\s*at\s*\]|\(\s*at\s*\)/gi, "@")
  const found = normalized.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? []
  const emails: string[] = []
  for (const email of found) {
    const lower = email.toLowerCase()
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || emails.includes(lower)) continue
    emails.push(lower)
    if (emails.length === 2) break
  }
  return emails
}

function addressFrom(html: string, text: string) {
  const attribute = html.match(/\baddress\s*=\s*["']([^"']+)["']/i)?.[1]
  const source = attribute ? decodeEntities(attribute) : text
  const match = source.match(/(?:гр\.|с\.|ул\.|бул\.|булевард|ж\.?\s?к\.|пл\.|кв\.)[^\n"\]]{3,160}/i)
  const value = match?.[0] ?? (attribute ? source : "")
  const cleaned = value.replace(/\s+/g, " ").replace(/[|,\s]+$/g, "").trim()
  return cleaned ? cleaned.slice(0, 180) : null
}

function websiteFrom(html: string) {
  for (const match of html.matchAll(/href\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) {
    const href = match[1] ?? ""
    if (/zdravenspravochnik\.com/i.test(href)) continue
    return href
  }
  return null
}

function exampleScore(item: Prepared) {
  return (item.phone ? 2 : 0) + (item.email ? 2 : 0) + (item.image ? 1 : 0)
}

function preview(text: string) {
  const flat = plainText(text)
  if (flat.length <= 220) return flat
  return `${flat.slice(0, 217).replace(/\s+\S*$/, "")}…`
}

function doctorName(title: string) {
  const cleaned = decodeEntities(title).replace(/\s+/g, " ").trim()
  const match = cleaned.match(/((?:проф\.|доц\.)\s*)?(д-р|доктор)\.?\s+(.+?)(?=\s+[–—-]\s+|$)/i)
  if (!match) {
    const head = cleaned.split(/\s+[–—-]\s+/)[0]?.trim() || cleaned
    return { title: null as string | null, fullName: head.slice(0, 160) }
  }
  const honorific = `${match[1] ?? ""}${match[2]}`.replace(/\s+/g, " ").replace(/доктор/i, "д-р").trim()
  const fullName = (match[3] ?? "").trim().replace(/[.,\s]+$/g, "")
  return { title: honorific || null, fullName: (fullName || cleaned).slice(0, 160) }
}

function facilityTypeFor(candidate: Candidate): FacilityType {
  const title = candidate.post.title
  if (/лаборатор/i.test(title)) return "laboratory"
  if (/болниц|мбал|умбал|\bсбр\b/i.test(title)) return "hospital"
  if (/център|клиник/i.test(title)) return "clinic"
  return candidate.facilityType ?? "clinic"
}

function personTitle(title: string) {
  return /^(?:(?:проф|доц)\.\s*)?(?:д-р|доктор)\b/i.test(title.trim())
}

function facilityTitle(title: string) {
  return /болниц|мбал|дкц|център|лаборатор|клиник|хоспис|диспансер|аптек|санаториум|\bсбр\b/i.test(title)
}

function descendants(children: Map<string, Term[]>, root: string) {
  const ids = new Set<string>()
  const stack = [root]
  while (stack.length) {
    const id = stack.pop()
    if (!id || ids.has(id)) continue
    ids.add(id)
    for (const child of children.get(id) ?? []) stack.push(child.id)
  }
  return ids
}

function uniqueTerms(terms: Term[]) {
  const seen = new Set<string>()
  return terms.filter((term) => {
    if (!term.slug || seen.has(term.slug)) return false
    seen.add(term.slug)
    return true
  })
}

function mentionsName(text: string, name: string) {
  const haystack = text.toLocaleLowerCase("bg")
  const needle = name.toLocaleLowerCase("bg")
  let from = 0
  while (from < haystack.length) {
    const index = haystack.indexOf(needle, from)
    if (index < 0) return false
    const before = haystack[index - 1] ?? ""
    const after = haystack[index + needle.length] ?? ""
    if (!/\p{L}/u.test(before) && !/\p{L}/u.test(after)) return true
    from = index + needle.length
  }
  return false
}

function inferCities(post: Post, cityByName: Map<string, Term>) {
  const haystack = `${post.title}\n${post.html.slice(0, 5000)}`
  const names = [...cityByName.keys()].sort((left, right) => right.length - left.length)
  const found: Term[] = []
  for (const name of names) {
    if (found.length === 2) break
    if (found.some((city) => city.name.toLocaleLowerCase("bg").includes(name))) continue
    const term = cityByName.get(name)
    if (term && mentionsName(haystack, name)) found.push(term)
  }
  return found
}

function pickSpread(items: Candidate[], limit: number, specialtySpread: boolean) {
  const buckets = new Map<string, Candidate[]>()
  for (const item of items) {
    const key = specialtySpread ? (item.specialties[0]?.slug ?? "other") : (item.cities[0]?.slug ?? "bulgaria")
    const list = buckets.get(key) ?? []
    list.push(item)
    buckets.set(key, list)
  }

  for (const list of buckets.values()) {
    list.sort((left, right) => {
      const byCity = (left.cities[0]?.name ?? "").localeCompare(right.cities[0]?.name ?? "", "bg")
      return byCity || left.post.id.localeCompare(right.post.id)
    })
  }

  const keys = [...buckets.keys()].sort((left, right) => left.localeCompare(right, "bg"))
  const picked: Candidate[] = []
  for (let round = 0; round < 3 && picked.length < limit; round++) {
    for (const key of keys) {
      const next = buckets.get(key)?.[round]
      if (!next) continue
      picked.push(next)
      if (picked.length >= limit) break
    }
  }
  return picked
}

function prepare(candidate: Candidate): Prepared | null {
  const slug = candidate.post.slug
  if (!slug) return null
  const cleaned = cleanContent(candidate.post.html || candidate.post.excerpt)
  const sourceText = cleaned.text || plainText(candidate.post.excerpt)
  const plain = plainText(sourceText)
  const phones = phonesFrom(`${candidate.post.title}\n${candidate.post.html}\n${plain}`)
  const emails = emailsFrom(`${candidate.post.html}\n${plain}`)
  const address = addressFrom(candidate.post.html, plain)
  const website = websiteFrom(candidate.post.html)
  const image = cleaned.images[0] ?? null
  const specialties = candidate.specialties.map((term) => term.slug)
  const cities = candidate.cities.map((term) => term.slug)
  const acceptsNhif = /нзок|здравн(?:ата|а)\s+каса|бзок/i.test(plain)
  const shared = {
    slug,
    phone: phones.join(", ") || null,
    email: emails[0] ?? null,
    website,
    address,
    photo_url: image,
    specialties,
    cities,
    status: "published",
    is_claimed: false,
    short_description: preview(plain) || null,
    accepts_nhif: acceptsNhif,
    source: "legacy_wp",
  }

  if (candidate.group === "specialists") {
    const name = doctorName(candidate.post.title)
    return {
      kind: "doctor",
      slug,
      title: candidate.post.title,
      phone: shared.phone,
      email: shared.email,
      image,
      row: { ...shared, full_name: name.fullName, title: name.title, bio: sourceText || name.fullName },
    }
  }

  return {
    kind: "facility",
    slug,
    title: candidate.post.title,
    phone: shared.phone,
    email: shared.email,
    image,
    row: {
      ...shared,
      name: decodeEntities(candidate.post.title).replace(/\s+/g, " ").trim().slice(0, 200),
      facility_type: facilityTypeFor(candidate),
      description: sourceText || candidate.post.title,
    },
  }
}

async function upsertFlexible(supabase: SupabaseClient, table: "doctors" | "facilities" | "cities" | "specialties", rows: Record<string, unknown>[]) {
  if (rows.length === 0) return
  let payload = rows.map((row) => ({ ...row }))
  for (let attempt = 0; attempt < 8; attempt++) {
    const { error } = await supabase.from(table).upsert(payload, { onConflict: "slug" })
    if (!error) return
    const missing = error.message.match(/Could not find the '([^']+)' column/)
    if (!missing) throw new Error(`${table}: ${error.message}`)
    const column = missing[1]
    console.log(`Колоната ${table}.${column} липсва — импортът продължава без нея.`)
    if (column === "source") {
      console.log("Пусни supabase/migrations/004_legacy_source.sql в Supabase SQL Editor, ако искаш source = legacy_wp.")
    }
    payload = payload.map((row) => {
      const copy = { ...row }
      delete copy[column]
      return copy
    })
  }
  throw new Error(`${table}: upsert не мина`)
}

async function claimedSlugs(supabase: SupabaseClient, table: "doctors" | "facilities", slugs: string[]) {
  const { data, error } = await supabase.from(table).select("slug, is_claimed").in("slug", slugs)
  if (error) return new Set<string>()
  return new Set((data ?? []).filter((row) => row.is_claimed).map((row) => String(row.slug)))
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
  }))
  const byId = new Map(terms.filter((term) => term.id).map((term) => [term.id, term]))
  const children = new Map<string, Term[]>()
  for (const term of byId.values()) {
    const list = children.get(term.parent) ?? []
    list.push(term)
    children.set(term.parent, list)
  }

  const groups: Record<Group, { ids: Set<string>; facilityType: FacilityType | null }> = {
    specialists: { ids: descendants(children, SPECIALISTS), facilityType: null },
    hospitals: { ids: descendants(children, HOSPITALS), facilityType: "hospital" },
    centers: { ids: descendants(children, CENTERS), facilityType: "clinic" },
    labs: { ids: descendants(children, LABS), facilityType: "laboratory" },
  }

  const cityByName = new Map<string, Term>()
  for (const term of byId.values()) {
    const parent = byId.get(term.parent)
    const isCity = parent?.parent === SPECIALISTS || term.parent === HOSPITALS || term.parent === CENTERS || term.parent === LABS
    if (!isCity || term.name.length < 3) continue
    const key = term.name.toLocaleLowerCase("bg")
    const current = cityByName.get(key)
    if (!current || term.slug.length < current.slug.length) cityByName.set(key, term)
  }

  const termsByPost = new Map<string, string[]>()
  for (const row of readCsv("term_relationships.csv")) {
    const postId = row[0]?.trim()
    const termId = row[2]?.trim()
    if (!postId || !termId) continue
    const list = termsByPost.get(postId) ?? []
    list.push(termId)
    termsByPost.set(postId, list)
  }

  const posts = readCsv("posts.csv").map((row) => ({
    id: row[0]?.trim() ?? "",
    title: decodeEntities(row[1] ?? "").replace(/\s+/g, " ").trim(),
    slug: decodeSlug(row[2] ?? ""),
    html: row[3] ?? "",
    excerpt: row[4] ?? "",
    status: row[5] ?? "",
    type: row[6] ?? "",
  }))

  const buckets: Record<Group, Candidate[]> = { specialists: [], hospitals: [], centers: [], labs: [] }
  const seenPosts = new Set<string>()

  for (const post of posts) {
    if (post.status !== "publish" || post.type !== "post" || !post.slug || seenPosts.has(post.id)) continue
    const termIds = termsByPost.get(post.id) ?? []
    const membership = (Object.keys(groups) as Group[]).filter((group) => termIds.some((id) => groups[group].ids.has(id)))
    if (membership.length === 0) continue

    const person = personTitle(post.title)
    const place = facilityTitle(post.title)
    let group: Group | null = null
    if (membership.includes("specialists") && (person || !place)) group = "specialists"
    else if (membership.includes("labs")) group = "labs"
    else if (membership.includes("hospitals")) group = "hospitals"
    else if (membership.includes("centers")) group = "centers"
    else if (person) group = "specialists"
    else if (place && /лаборатор/i.test(post.title)) group = "labs"
    else if (place && /болниц|мбал|\bсбр\b/i.test(post.title)) group = "hospitals"
    else if (place) group = "centers"
    if (!group) continue

    const postTerms = termIds.map((id) => byId.get(id)).filter((term): term is Term => Boolean(term))
    const specialties = uniqueTerms(
      postTerms.flatMap((term) => {
        if (term.parent === SPECIALISTS) return [term]
        const parent = byId.get(term.parent)
        return parent?.parent === SPECIALISTS ? [parent] : []
      })
    )
    const cities = uniqueTerms(
      postTerms.filter((term) => {
        const parent = byId.get(term.parent)
        if (!parent) return false
        if (group === "specialists") return parent.parent === SPECIALISTS
        return term.parent === (group === "hospitals" ? HOSPITALS : group === "centers" ? CENTERS : LABS)
      })
    )
    const resolvedCities = cities.length > 0 ? cities : inferCities(post, cityByName)

    buckets[group].push({ post, group, facilityType: groups[group].facilityType, specialties, cities: resolvedCities })
    seenPosts.add(post.id)
  }

  console.log(
    `Кандидати: специалисти ${buckets.specialists.length}, болници ${buckets.hospitals.length}, центрове ${buckets.centers.length}, лаборатории ${buckets.labs.length}`
  )

  const selected = [
    ...pickSpread(buckets.specialists, LIMITS.specialists, true),
    ...pickSpread(buckets.hospitals, LIMITS.hospitals, false),
    ...pickSpread(buckets.centers, LIMITS.centers, false),
    ...pickSpread(buckets.labs, LIMITS.labs, false),
  ]

  const prepared = selected.map(prepare).filter((item): item is Prepared => Boolean(item))
  const usedSlugs = new Set<string>()
  const unique = prepared.filter((item) => {
    if (usedSlugs.has(item.slug)) return false
    usedSlugs.add(item.slug)
    return true
  })

  const catalog = new Map<string, { name: string; slug: string }>()
  const specialtyCatalog = new Map<string, { name: string; slug: string }>()
  for (const candidate of selected) {
    for (const city of candidate.cities) catalog.set(city.slug, { name: city.name, slug: city.slug })
    for (const specialty of candidate.specialties) specialtyCatalog.set(specialty.slug, { name: specialty.name, slug: specialty.slug })
  }

  const doctors = unique.filter((item) => item.kind === "doctor")
  const facilities = unique.filter((item) => item.kind === "facility")
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  await upsertFlexible(supabase, "cities", [...catalog.values()])
  await upsertFlexible(supabase, "specialties", [...specialtyCatalog.values()])

  const claimedDoctors = await claimedSlugs(supabase, "doctors", doctors.map((item) => item.slug))
  const claimedFacilities = await claimedSlugs(supabase, "facilities", facilities.map((item) => item.slug))
  const doctorRows = doctors.filter((item) => !claimedDoctors.has(item.slug))
  const facilityRows = facilities.filter((item) => !claimedFacilities.has(item.slug))

  await upsertFlexible(supabase, "doctors", doctorRows.map((item) => item.row))
  await upsertFlexible(supabase, "facilities", facilityRows.map((item) => item.row))

  console.log(`Импортирани лекари: ${doctorRows.length}`)
  console.log(`Импортирани заведения: ${facilityRows.length}`)
  if (claimedDoctors.size || claimedFacilities.size) {
    console.log(`Пропуснати вече заявени профили: ${claimedDoctors.size + claimedFacilities.size}`)
  }

  console.log("\nЛекари:")
  for (const item of doctorRows) console.log(`- /${item.slug}`)
  console.log("\nЗаведения:")
  for (const item of facilityRows) console.log(`- /${item.slug}`)

  const examples = [...unique].sort((left, right) => exampleScore(right) - exampleScore(left)).slice(0, 3)
  console.log("\nПримери:")
  for (const item of examples) {
    console.log(`- ${item.title}`)
    console.log(`  slug: /${item.slug}`)
    console.log(`  phone: ${item.phone ?? "—"}`)
    console.log(`  email: ${item.email ?? "—"}`)
    console.log(`  image: ${item.image ?? "—"}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
