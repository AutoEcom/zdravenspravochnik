import type { City } from "@/types/database"

import { createClient } from "@/lib/supabase/server"

export async function getCities(): Promise<City[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}
