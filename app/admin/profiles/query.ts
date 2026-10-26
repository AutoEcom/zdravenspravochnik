import { humanLabel, specialtyDisplay } from "@/lib/content/normalize"
import { labelFromSlug } from "@/lib/content/placeholders"
import { PAGE_SIZE } from "@/lib/content/listing"
import { createAdminClient } from "@/lib/supabase/admin"
import { cleanSearchText } from "@/lib/supabase/queries/search"
import type { PublishStatus } from "@/types/database"

export type ProfileKind = "all" | "doctor" | "facility"

export type AdminProfileHit = {
  id: string
  kind: "doctor" | "facility"
  title: string | null
  name: string
  slug: string
  cities: string[]
  status: PublishStatus
  source: string | null
}

type DoctorListRow = {
  id: string
  slug: string
  full_name: string
  title: string | null
  cities: string[] | null
  status: PublishStatus
  source: string | null
}

type FacilityListRow = {
  id: string
  slug: string
  name: string
  cities: string[] | null
  status: PublishStatus
  source: string | null
}

function quoteLike(value: string) {
  return `"*${value.replace(/"/g, "")}*"`
}

export function parseProfileKind(value: string | undefined): ProfileKind {
  if (value === "doctor" || value === "facility") return value
  return "all"
}

export function matchingCitySlugs(cities: { name: string; slug: string }[], query: string) {
  const needle = query.toLocaleLowerCase("bg")
  if (needle.length < 2) return []
  return cities
    .filter((city) => {
      const name = city.name.toLocaleLowerCase("bg")
      const slug = city.slug.toLocaleLowerCase("bg")
      return name.includes(needle) || slug.includes(needle)
    })
    .sort((left, right) => {
      const leftExact = left.name.toLocaleLowerCase("bg") === needle || left.slug.toLocaleLowerCase("bg") === needle
      const rightExact = right.name.toLocaleLowerCase("bg") === needle || right.slug.toLocaleLowerCase("bg") === needle
      return Number(rightExact) - Number(leftExact)
    })
    .slice(0, 30)
    .map((city) => city.slug)
}

function orFilter(query: string, columns: string[], citySlugs: string[]) {
  const parts: string[] = []
  if (query) {
    const like = quoteLike(query)
    for (const column of columns) parts.push(`${column}.ilike.${like}`)
  }
  const slugs = citySlugs.map((slug) => slug.trim()).filter((slug) => slug && !/[,{}()"\\]/.test(slug))
  if (slugs.length > 0) parts.push(`cities.ov.{${slugs.join(",")}}`)
  return parts.join(",")
}

function asCities(value: string[] | null) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

export function slugOptions(
  rows: { name: string; slug: string }[],
  current: string[],
  mode: "city" | "specialty",
) {
  const map = new Map<string, string>()
  for (const row of rows) {
    const slug = row.slug?.trim()
    const name = row.name?.trim()
    if (!slug || map.has(slug)) continue
    map.set(slug, name || labelFromSlug(slug))
  }
  for (const slug of current) {
    const trimmed = slug?.trim()
    if (!trimmed || map.has(trimmed)) continue
    map.set(trimmed, labelFromSlug(trimmed))
  }
  return [...map.entries()]
    .map(([slug, name]) => ({
      slug,
      name: mode === "specialty" ? specialtyDisplay(name) : humanLabel(name) || name,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "bg") || left.slug.localeCompare(right.slug))
}

export async function listAdminProfiles(input: {
  query: string
  kind: ProfileKind
  page: number
  citySlugs: string[]
}): Promise<{ rows: AdminProfileHit[]; total: number } | { error: string }> {
  const admin = createAdminClient()
  const query = cleanSearchText(input.query)
  const from = (input.page - 1) * PAGE_SIZE
  const doctorFilter = orFilter(query, ["full_name", "title", "slug"], input.citySlugs)
  const facilityFilter = orFilter(query, ["name", "slug"], input.citySlugs)

  if (input.kind === "doctor") {
    const listed = await listDoctors(admin, doctorFilter, from, from + PAGE_SIZE - 1, true)
    if ("error" in listed) return listed
    return { rows: listed.rows, total: listed.total }
  }
  if (input.kind === "facility") {
    const listed = await listFacilities(admin, facilityFilter, from, from + PAGE_SIZE - 1, true)
    if ("error" in listed) return listed
    return { rows: listed.rows, total: listed.total }
  }

  const [doctorCount, facilityCount] = await Promise.all([
    countDoctors(admin, doctorFilter),
    countFacilities(admin, facilityFilter),
  ])
  if ("error" in doctorCount) return doctorCount
  if ("error" in facilityCount) return facilityCount

  const total = doctorCount.total + facilityCount.total
  if (from >= total) return { rows: [], total }

  if (from >= doctorCount.total) {
    const facilityFrom = from - doctorCount.total
    const facilities = await listFacilities(admin, facilityFilter, facilityFrom, facilityFrom + PAGE_SIZE - 1, false)
    if ("error" in facilities) return facilities
    return { rows: facilities.rows, total }
  }

  const doctorTake = Math.min(PAGE_SIZE, doctorCount.total - from)
  const doctors = await listDoctors(admin, doctorFilter, from, from + doctorTake - 1, false)
  if ("error" in doctors) return doctors
  const remain = PAGE_SIZE - doctors.rows.length
  if (remain <= 0) return { rows: doctors.rows, total }

  const facilities = await listFacilities(admin, facilityFilter, 0, remain - 1, false)
  if ("error" in facilities) return facilities
  return { rows: [...doctors.rows, ...facilities.rows], total }
}

function doctorQuery(admin: ReturnType<typeof createAdminClient>, filter: string) {
  let request = admin.from("doctors").select("id, slug, full_name, title, cities, status, source", { count: "exact" })
  if (filter) request = request.or(filter)
  return request.order("full_name", { ascending: true }).order("id", { ascending: true })
}

function facilityQuery(admin: ReturnType<typeof createAdminClient>, filter: string) {
  let request = admin.from("facilities").select("id, slug, name, cities, status, source", { count: "exact" })
  if (filter) request = request.or(filter)
  return request.order("name", { ascending: true }).order("id", { ascending: true })
}

async function countDoctors(
  admin: ReturnType<typeof createAdminClient>,
  filter: string,
): Promise<{ total: number } | { error: string }> {
  let request = admin.from("doctors").select("id", { count: "exact", head: true })
  if (filter) request = request.or(filter)
  const { count, error } = await request
  if (error) return { error: "Списъкът с лекари не се зареди." }
  return { total: count ?? 0 }
}

async function countFacilities(
  admin: ReturnType<typeof createAdminClient>,
  filter: string,
): Promise<{ total: number } | { error: string }> {
  let request = admin.from("facilities").select("id", { count: "exact", head: true })
  if (filter) request = request.or(filter)
  const { count, error } = await request
  if (error) return { error: "Списъкът със заведения не се зареди." }
  return { total: count ?? 0 }
}

async function listDoctors(
  admin: ReturnType<typeof createAdminClient>,
  filter: string,
  from: number,
  to: number,
  withTotal: boolean,
) {
  const { data, error, count } = await doctorQuery(admin, filter).range(from, to)
  if (error) return { error: "Списъкът с лекари не се зареди." }
  const rows = ((data ?? []) as DoctorListRow[]).map((row) => ({
    id: row.id,
    kind: "doctor" as const,
    title: row.title,
    name: row.full_name,
    slug: row.slug,
    cities: asCities(row.cities),
    status: row.status,
    source: row.source,
  }))
  return { rows, total: withTotal ? count ?? rows.length : rows.length }
}

async function listFacilities(
  admin: ReturnType<typeof createAdminClient>,
  filter: string,
  from: number,
  to: number,
  withTotal: boolean,
) {
  const { data, error, count } = await facilityQuery(admin, filter).range(from, to)
  if (error) return { error: "Списъкът със заведения не се зареди." }
  const rows = ((data ?? []) as FacilityListRow[]).map((row) => ({
    id: row.id,
    kind: "facility" as const,
    title: null,
    name: row.name,
    slug: row.slug,
    cities: asCities(row.cities),
    status: row.status,
    source: row.source,
  }))
  return { rows, total: withTotal ? count ?? rows.length : rows.length }
}
