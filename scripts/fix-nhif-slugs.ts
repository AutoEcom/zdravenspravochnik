import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { cleanDisplayName } from "../lib/content/display-name"
import { latinSlug } from "../lib/content/slug"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const EXAMPLE = '"Аипсимп По Очни Болести - Джъст Луук" ЕООД'

function loadEnvFile(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "")
  }
}

function hash(value: string) {
  let h = 2166136261
  for (let index = 0; index < value.length; index++) {
    h ^= value.charCodeAt(index)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

function hasNonAscii(value: string) {
  return /[^\u0000-\u007F]/.test(value)
}

type Row = {
  id: string
  slug: string
  label: string
  city: string | null
  source: string | null
  table: "doctors" | "facilities"
}

async function loadAll(supabase: SupabaseClient, table: "doctors" | "facilities" | "articles", columns: string) {
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

function allocate(label: string, city: string | null, taken: Set<string>) {
  const base = latinSlug(cleanDisplayName(label), 72) || "profil"
  const citySlug = city ? latinSlug(city, 32) : ""
  const withCity =
    citySlug && !base.endsWith(`-${citySlug}`) ? latinSlug(`${base}-${citySlug}`, 80) : ""
  for (const candidate of [base, withCity]) {
    if (candidate && !taken.has(candidate)) return candidate
  }
  const root = withCity || base
  for (let index = 2; index < 500; index++) {
    const next = `${root.slice(0, 70)}-${index}`.replace(/-+$/g, "")
    if (!taken.has(next)) return next
  }
  return `${root.slice(0, 58)}-${hash(label)}`
}

async function main() {
  const sample = cleanDisplayName(EXAMPLE)
  if (sample !== "Аипсимп По Очни Болести - Джъст Луук") {
    throw new Error(`cleanDisplayName: ${sample}`)
  }

  loadEnvFile(path.join(root, ".env.local"))
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Липсват ключовете за Supabase.")

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [doctors, facilities, articles] = await Promise.all([
    loadAll(supabase, "doctors", "id, slug, full_name, cities, source"),
    loadAll(supabase, "facilities", "id, slug, name, cities, source"),
    loadAll(supabase, "articles", "slug"),
  ])

  const taken = new Set<string>()
  for (const row of [...doctors, ...facilities, ...articles]) {
    const slug = String(row.slug ?? "")
    if (slug) taken.add(slug)
  }

  const targets: Row[] = [
    ...facilities.map((row) => ({
      id: String(row.id),
      slug: String(row.slug ?? ""),
      label: String(row.name ?? ""),
      city: Array.isArray(row.cities) ? String(row.cities[0] ?? "") || null : null,
      source: row.source ? String(row.source) : null,
      table: "facilities" as const,
    })),
    ...doctors.map((row) => ({
      id: String(row.id),
      slug: String(row.slug ?? ""),
      label: String(row.full_name ?? ""),
      city: Array.isArray(row.cities) ? String(row.cities[0] ?? "") || null : null,
      source: row.source ? String(row.source) : null,
      table: "doctors" as const,
    })),
  ].filter((row) => row.source !== "legacy_wp" && hasNonAscii(row.slug))

  for (const row of targets) taken.delete(row.slug)
  const planned = targets.map((row) => {
    const next = allocate(row.label, row.city, taken)
    taken.add(next)
    return { ...row, next }
  })

  let facilitiesUpdated = 0
  let doctorsUpdated = 0
  for (let index = 0; index < planned.length; index += 20) {
    const slice = planned.slice(index, index + 20)
    await Promise.all(
      slice.map(async (row) => {
        const { error } = await supabase
          .from(row.table)
          .update({ slug: row.next })
          .eq("id", row.id)
          .or("source.is.null,source.neq.legacy_wp")
        if (error) throw new Error(`${row.table} ${row.slug}: ${error.message}`)
      })
    )
    for (const row of slice) {
      if (row.table === "facilities") facilitiesUpdated++
      else doctorsUpdated++
    }
    if (planned.length > 40 && (index + slice.length) % 200 === 0) {
      console.log(`Записани: ${index + slice.length}/${planned.length}`)
    }
  }

  console.log(
    JSON.stringify(
      {
        checked: { facilities: facilities.length, doctors: doctors.length },
        updated: planned.length,
        facilitiesUpdated,
        doctorsUpdated,
        sample: planned.slice(0, 10).map((row) => ({
          table: row.table,
          old: row.slug,
          next: row.next,
          label: cleanDisplayName(row.label),
        })),
        displayExample: { from: EXAMPLE, to: sample },
      },
      null,
      2
    )
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
