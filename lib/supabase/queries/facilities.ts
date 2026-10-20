import type { Facility } from "@/types/database"

import { createClient } from "@/lib/supabase/server"

export async function getFeaturedFacilities(limit = 6): Promise<Facility[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("is_premium", { ascending: false })
    .order("rating", { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getFacilitiesInCity(
  city: string,
  excludeId?: string,
  limit = 3
): Promise<Facility[]> {
  const supabase = await createClient()
  let query = supabase
    .from("facilities")
    .select("*")
    .eq("status", "published")
    .contains("cities", [city])
    .order("rating", { ascending: false })
    .limit(limit)

  if (excludeId) query = query.neq("id", excludeId)

  const { data, error } = await query
  if (error) {
    throw error
  }

  return data ?? []
}

export async function getFacilityBySlug(slug: string): Promise<Facility | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}
