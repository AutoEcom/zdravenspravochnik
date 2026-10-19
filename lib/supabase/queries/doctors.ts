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

export async function getFeaturedDoctors(): Promise<Doctor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("is_premium", { ascending: false })
    .order("rating", { ascending: false })
    .limit(12)

  if (error) {
    throw error
  }

  return data ?? []
}
