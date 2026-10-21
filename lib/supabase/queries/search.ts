import type { Doctor, Facility } from "@/types/database"

import { createClient } from "@/lib/supabase/server"

export type ProfileSearch = {
  specialties?: string[]
  cities?: string[]
  query?: string
}

function cleanList(values: string[] | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))]
}

function likeTerm(value: string | undefined) {
  return value?.replace(/[%_,()]/g, "").trim() ?? ""
}

export async function searchDoctors(filters: ProfileSearch): Promise<Doctor[]> {
  const specialties = cleanList(filters.specialties)
  const cities = cleanList(filters.cities)
  const query = likeTerm(filters.query)
  const supabase = await createClient()
  let request = supabase.from("doctors").select("*").eq("status", "published")
  if (specialties.length > 0) request = request.overlaps("specialties", specialties)
  if (cities.length > 0) request = request.overlaps("cities", cities)
  if (query) request = request.or(`full_name.ilike.%${query}%,title.ilike.%${query}%`)

  const { data, error } = await request
    .order("is_featured", { ascending: false })
    .order("is_premium", { ascending: false })
    .order("rating", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function searchFacilities(filters: ProfileSearch): Promise<Facility[]> {
  const specialties = cleanList(filters.specialties)
  const cities = cleanList(filters.cities)
  const query = likeTerm(filters.query)
  const supabase = await createClient()
  let request = supabase.from("facilities").select("*").eq("status", "published")
  if (specialties.length > 0) request = request.overlaps("specialties", specialties)
  if (cities.length > 0) request = request.overlaps("cities", cities)
  if (query) request = request.ilike("name", `%${query}%`)

  const { data, error } = await request
    .order("is_featured", { ascending: false })
    .order("is_premium", { ascending: false })
    .order("rating", { ascending: false })

  if (error) throw error
  return data ?? []
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
