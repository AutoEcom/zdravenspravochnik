import type { Doctor } from "@/types/database"

import { createClient } from "@/lib/supabase/server"

export async function getDoctorBySlug(slug: string): Promise<Doctor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function getDoctorsBySpecialtyAndCity(
  specialty: string,
  city: string
): Promise<Doctor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("status", "published")
    .contains("specialties", [specialty])
    .contains("cities", [city])
    .order("is_premium", { ascending: false })
    .order("rating", { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("status", "published")
    .contains("specialties", [specialty])
    .order("is_premium", { ascending: false })
    .order("rating", { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getDoctorsInCity(
  city: string,
  excludeId?: string,
  limit = 3
): Promise<Doctor[]> {
  const supabase = await createClient()
  let query = supabase
    .from("doctors")
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

export async function getFeaturedDoctors(limit = 12): Promise<Doctor[]> {
  const supabase = await createClient()
  const preferred = await supabase
    .from("doctors")
    .select("*")
    .eq("status", "published")
    .or("is_claimed.eq.true,is_featured.eq.true")
    .order("is_claimed", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("is_premium", { ascending: false })
    .order("full_name", { ascending: true })
    .limit(limit)

  if (preferred.error) throw preferred.error
  if ((preferred.data ?? []).length > 0) return preferred.data ?? []

  const fallback = await supabase
    .from("doctors")
    .select("*")
    .eq("status", "published")
    .not("phone", "is", null)
    .neq("phone", "")
    .order("is_premium", { ascending: false })
    .order("full_name", { ascending: true })
    .limit(limit)

  if (fallback.error) throw fallback.error
  return (fallback.data ?? []).filter((row) => row.phone?.trim())
}
