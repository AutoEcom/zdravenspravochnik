import type { User } from "@supabase/supabase-js"

import { isUserRole } from "@/lib/auth/roles"
import { createAdminClient } from "@/lib/supabase/admin"
import type { UserRole } from "@/types/database"

function metadataName(user: User) {
  const fullName = user.user_metadata.full_name
  const name = user.user_metadata.name
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim()
  if (typeof name === "string" && name.trim()) return name.trim()
  return null
}

export async function ensureProfile(user: User): Promise<UserRole> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  const fullName = metadataName(user)

  if (!data) {
    const { error: insertError } = await admin.from("profiles").insert({
      id: user.id,
      email: user.email ?? null,
      full_name: fullName,
    })
    if (insertError) throw insertError
    return "patient"
  }

  if ((user.email && data.email !== user.email) || (!data.full_name && fullName)) {
    await admin
      .from("profiles")
      .update({
        email: user.email ?? data.email,
        full_name: data.full_name ?? fullName,
      })
      .eq("id", user.id)
  }

  return isUserRole(data.role) ? data.role : "patient"
}
