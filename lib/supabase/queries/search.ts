import type { FacilityGroup } from "@/lib/content/facility-groups"
import { PAGE_SIZE } from "@/lib/content/listing"
import { createClient } from "@/lib/supabase/server"
import type { Doctor, Facility } from "@/types/database"

export type ProfileSearch = {
  specialties?: string[]
  cities?: string[]
  query?: string
  page?: number
  facilityGroup?: FacilityGroup | ""
}

export type PageResult<T> = {
  rows: T[]
  total: number
}

export type DirectoryHit =
  | { kind: "doctor"; profile: Doctor }
  | { kind: "facility"; profile: Facility }

type Bucket = "priority" | "phone" | "rest"
type DirectoryKind = "" | "doctor" | "facility"

type FilterStep = {
  eq: (column: string, value: string | boolean) => FilterStep
  overlaps: (column: string, value: readonly string[]) => FilterStep
  or: (filters: string) => FilterStep
  not: (column: string, operator: string, value: string | null) => FilterStep
  neq: (column: string, value: string) => FilterStep
  in: (column: string, value: readonly string[]) => FilterStep
  order: (column: string, options?: { ascending?: boolean }) => FilterStep
  range: (from: number, to: number) => FilterStep
}

const buckets: Bucket[] = ["priority", "phone", "rest"]

export function cleanSearchText(value: string | undefined) {
  return value?.replace(/[%_*,()"\\]/g, " ").replace(/\s+/g, " ").trim() ?? ""
}

function cleanList(values: string[] | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))]
}

function quoteLike(value: string) {
  return `"*${value.replace(/"/g, "")}*"`
}

function pageStart(page: number | undefined) {
  const current = page && page > 0 ? Math.floor(page) : 1
  return (current - 1) * PAGE_SIZE
}

function applyText(request: FilterStep, filters: ProfileSearch, columns: readonly string[]) {
  let next = request
  const specialties = cleanList(filters.specialties)
  const cities = cleanList(filters.cities)
  const query = cleanSearchText(filters.query)
  if (specialties.length > 0) next = next.overlaps("specialties", specialties)
  if (cities.length > 0) next = next.overlaps("cities", cities)
  if (query) next = next.or(columns.map((column) => `${column}.ilike.${quoteLike(query)}`).join(","))
  return next
}

function applyBucket(request: FilterStep, bucket: Bucket) {
  if (bucket === "priority") return request.or("is_claimed.eq.true,is_featured.eq.true")
  const next = request.eq("is_claimed", false).eq("is_featured", false)
  if (bucket === "phone") return next.not("phone", "is", null).neq("phone", "")
  return next.or("phone.is.null,phone.eq.")
}

function applyFacilityGroup(request: FilterStep, group: FacilityGroup | "" | undefined) {
  if (group === "bolnica") {
    return request.or("facility_type.eq.hospital,name.ilike.*болниц*,name.ilike.*мбал*,name.ilike.*умбал*")
  }
  if (group === "laboratoria") {
    return request.or("facility_type.eq.laboratory,name.ilike.*лаборатор*")
  }
  if (group === "dentalni") {
    return request.or("specialties.ov.{stomatologia},name.ilike.*стомат*,name.ilike.*дент*")
  }
  if (group === "centar" || group === "drugi") {
    let next =
      group === "centar"
        ? request.eq("facility_type", "clinic")
        : request.in("facility_type", ["practice", "pharmacy", "other"])
    next = next
      .not("specialties", "ov", "{stomatologia}")
      .not("name", "ilike", "%стомат%")
      .not("name", "ilike", "%дент%")
      .not("name", "ilike", "%лаборатор%")
      .not("name", "ilike", "%болниц%")
      .not("name", "ilike", "%мбал%")
    return next
  }
  return request
}

function orderByName(request: FilterStep, column: "full_name" | "name") {
  return request
    .order("is_claimed", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("is_premium", { ascending: false })
    .order(column, { ascending: true })
    .order("id", { ascending: true })
}

function slices(counts: number[], offset: number, size: number) {
  const found: { index: number; from: number; to: number }[] = []
  let cursor = 0
  for (let index = 0; index < counts.length; index += 1) {
    const start = cursor
    const end = cursor + counts[index]
    const from = Math.max(offset, start)
    const to = Math.min(offset + size, end)
    if (from < to) found.push({ index, from: from - start, to: to - start - 1 })
    cursor = end
  }
  return found
}

async function counted(request: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count, error } = await request
  if (error) {
    console.error(error)
    throw error
  }
  return count ?? 0
}

async function rowsOf<T>(request: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const { data, error } = await request
  if (error) {
    console.error(error)
    throw error
  }
  return data ?? []
}

function doctorFilters(request: FilterStep, filters: ProfileSearch, bucket: Bucket) {
  return applyBucket(applyText(request.eq("status", "published"), filters, ["full_name", "title"]), bucket)
}

function facilityFilters(request: FilterStep, filters: ProfileSearch, bucket: Bucket) {
  return applyBucket(
    applyText(applyFacilityGroup(request.eq("status", "published"), filters.facilityGroup), filters, ["name"]),
    bucket,
  )
}

export async function searchDoctors(filters: ProfileSearch): Promise<PageResult<Doctor>> {
  const supabase = await createClient()
  const counts = await Promise.all(
    buckets.map((bucket) =>
      counted(
        doctorFilters(
          supabase.from("doctors").select("*", { count: "exact", head: true }) as unknown as FilterStep,
          filters,
          bucket,
        ) as unknown as PromiseLike<{ count: number | null; error: { message: string } | null }>,
      ),
    ),
  )
  const parts = slices(counts, pageStart(filters.page), PAGE_SIZE)
  const groups = await Promise.all(
    parts.map((part) =>
      rowsOf(
        orderByName(
          doctorFilters(
            supabase.from("doctors").select("*") as unknown as FilterStep,
            filters,
            buckets[part.index],
          ),
          "full_name",
        ).range(part.from, part.to) as unknown as PromiseLike<{ data: Doctor[] | null; error: { message: string } | null }>,
      ),
    ),
  )
  return { rows: groups.flat(), total: counts.reduce((sum, count) => sum + count, 0) }
}

export async function searchFacilities(filters: ProfileSearch): Promise<PageResult<Facility>> {
  const supabase = await createClient()
  const counts = await Promise.all(
    buckets.map((bucket) =>
      counted(
        facilityFilters(
          supabase.from("facilities").select("*", { count: "exact", head: true }) as unknown as FilterStep,
          filters,
          bucket,
        ) as unknown as PromiseLike<{ count: number | null; error: { message: string } | null }>,
      ),
    ),
  )
  const parts = slices(counts, pageStart(filters.page), PAGE_SIZE)
  const groups = await Promise.all(
    parts.map((part) =>
      rowsOf(
        orderByName(
          facilityFilters(
            supabase.from("facilities").select("*") as unknown as FilterStep,
            filters,
            buckets[part.index],
          ),
          "name",
        ).range(part.from, part.to) as unknown as PromiseLike<{
          data: Facility[] | null
          error: { message: string } | null
        }>,
      ),
    ),
  )
  return { rows: groups.flat(), total: counts.reduce((sum, count) => sum + count, 0) }
}

export async function searchDirectory(
  filters: ProfileSearch & { kind?: DirectoryKind },
): Promise<PageResult<DirectoryHit>> {
  const kind = filters.kind ?? ""
  const supabase = await createClient()
  const doctorCounts =
    kind === "facility"
      ? [0, 0, 0]
      : await Promise.all(
          buckets.map((bucket) =>
            counted(
              doctorFilters(
                supabase.from("doctors").select("*", { count: "exact", head: true }) as unknown as FilterStep,
                filters,
                bucket,
              ) as unknown as PromiseLike<{ count: number | null; error: { message: string } | null }>,
            ),
          ),
        )
  const facilityCounts =
    kind === "doctor"
      ? [0, 0, 0]
      : await Promise.all(
          buckets.map((bucket) =>
            counted(
              facilityFilters(
                supabase.from("facilities").select("*", { count: "exact", head: true }) as unknown as FilterStep,
                filters,
                bucket,
              ) as unknown as PromiseLike<{ count: number | null; error: { message: string } | null }>,
            ),
          ),
        )

  const counts = [0, 1, 2].flatMap((index) => [doctorCounts[index], facilityCounts[index]])
  const parts = slices(counts, pageStart(filters.page), PAGE_SIZE)
  const groups = await Promise.all(
    parts.map(async (part) => {
      const facilitySide = part.index % 2 === 1
      const bucket = buckets[Math.floor(part.index / 2)]
      if (!facilitySide) {
        const rows = await rowsOf(
          orderByName(
            doctorFilters(supabase.from("doctors").select("*") as unknown as FilterStep, filters, bucket),
            "full_name",
          ).range(part.from, part.to) as unknown as PromiseLike<{ data: Doctor[] | null; error: { message: string } | null }>,
        )
        return rows.map((profile) => ({ kind: "doctor" as const, profile }))
      }
      const rows = await rowsOf(
        orderByName(
          facilityFilters(supabase.from("facilities").select("*") as unknown as FilterStep, filters, bucket),
          "name",
        ).range(part.from, part.to) as unknown as PromiseLike<{
          data: Facility[] | null
          error: { message: string } | null
        }>,
      )
      return rows.map((profile) => ({ kind: "facility" as const, profile }))
    }),
  )

  return {
    rows: groups.flat(),
    total: counts.reduce((sum, count) => sum + count, 0),
  }
}

export async function getPublishedDoctors(limit = 9): Promise<Doctor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("is_premium", { ascending: false })
    .order("rating", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getPublishedFacilities(limit = 9): Promise<Facility[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("is_premium", { ascending: false })
    .order("rating", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getPublishedTerms(): Promise<{ specialties: string[]; cities: string[] }> {
  const supabase = await createClient()
  const [doctors, facilities] = await Promise.all([
    supabase.from("doctors").select("specialties, cities").eq("status", "published"),
    supabase.from("facilities").select("specialties, cities").eq("status", "published"),
  ])
  if (doctors.error) throw doctors.error
  if (facilities.error) throw facilities.error

  const specialties = new Set<string>()
  const cities = new Set<string>()
  for (const row of [...(doctors.data ?? []), ...(facilities.data ?? [])]) {
    for (const slug of row.specialties ?? []) specialties.add(slug)
    for (const slug of row.cities ?? []) cities.add(slug)
  }
  return { specialties: [...specialties], cities: [...cities] }
}
