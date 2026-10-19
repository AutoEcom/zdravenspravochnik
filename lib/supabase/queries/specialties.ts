import type { Specialty } from "@/types/database"

import { createClient } from "@/lib/supabase/server"

export async function getSpecialties(): Promise<Specialty[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("specialties")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}
