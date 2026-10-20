import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/types"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Липсва SUPABASE_SERVICE_ROLE_KEY.")
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
