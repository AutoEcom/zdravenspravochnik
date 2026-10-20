import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/database"

export const getSessionProfile = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null as Profile | null }
  }

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  return { user, profile: data }
})
