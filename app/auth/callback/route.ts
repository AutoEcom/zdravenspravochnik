import { NextResponse } from "next/server"

import { ensureProfile } from "@/lib/auth/profile"
import { homeForRole } from "@/lib/auth/roles"
import { safeNextPath } from "@/lib/auth/paths"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = safeNextPath(url.searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          const role = await ensureProfile(user)
          return NextResponse.redirect(new URL(next ?? homeForRole(role), url.origin))
        } catch (profileError) {
          console.error(profileError)
        }
      }
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin))
}
