import type { Facility } from "@/types/database"

import { createClient } from "@/lib/supabase/server"

export async function getFeaturedFacilities(limit = 6): Promise<Facility[]> {
  const supabase = await createClient()
  const preferred = await supabase
    .from("facilities")
    .select("*")
    .eq("status", "published")
    .or("is_claimed.eq.true,is_featured.eq.true")
    .order("is_claimed", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("is_premium", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit)

  if (preferred.error) throw preferred.error
  if ((preferred.data ?? []).length > 0) return preferred.data ?? []

  const fallback = await supabase
    .from("facilities")
    .select("*")
    .eq("status", "published")
    .not("phone", "is", null)
    .neq("phone", "")
    .order("is_premium", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit)

  if (fallback.error) throw fallback.error
  return (fallback.data ?? []).filter((row) => row.phone?.trim())
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
