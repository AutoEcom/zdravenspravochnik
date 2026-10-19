import type { Facility } from "@/types/database"

import { createClient } from "@/lib/supabase/server"

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
