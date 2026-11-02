import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function loadEnvFile(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "")
  }
}

function hash(id: string) {
  let value = 2166136261
  for (let index = 0; index < id.length; index += 1) {
    value ^= id.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function inRange(id: string, min: number, max: number) {
  return min + (hash(id) % (max - min + 1))
}

async function loadPublishedIds(supabase: ReturnType<typeof createClient<any>>, table: string) {
  const ids: string[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("status", "published")
      .range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data?.length) break
    for (const row of data as { id?: string }[]) {
      if (row.id) ids.push(row.id)
    }
    if (data.length < 1000) break
    from += 1000
  }
  return ids
}

async function writeCounts(
  supabase: ReturnType<typeof createClient<any>>,
  table: string,
  ids: string[],
  min: number,
  max: number
) {
  let index = 0
  async function worker() {
    while (index < ids.length) {
      const current = index
      index += 1
      const id = ids[current]
      const view_count = inRange(id, min, max)
      const { error } = await supabase.from(table).update({ view_count }).eq("id", id)
      if (error) throw new Error(`${table} ${id}: ${error.message}`)
      if ((current + 1) % 500 === 0) console.log(`${table}: ${current + 1}/${ids.length}`)
    }
  }
  const workers = Math.min(20, ids.length)
  if (workers > 0) await Promise.all(Array.from({ length: workers }, () => worker()))
  return ids.length
}

async function main() {
  loadEnvFile(path.join(root, ".env.local"))
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Липсва NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY.")

  const supabase = createClient<any>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [doctors, facilities, articles] = await Promise.all([
    loadPublishedIds(supabase, "doctors"),
    loadPublishedIds(supabase, "facilities"),
    loadPublishedIds(supabase, "articles"),
  ])

  const doctorCount = await writeCounts(supabase, "doctors", doctors, 20_000, 190_000)
  const facilityCount = await writeCounts(supabase, "facilities", facilities, 20_000, 190_000)
  const articleCount = await writeCounts(supabase, "articles", articles, 70_000, 320_000)

  console.log(`doctors: ${doctorCount}`)
  console.log(`facilities: ${facilityCount}`)
  console.log(`articles: ${articleCount}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
