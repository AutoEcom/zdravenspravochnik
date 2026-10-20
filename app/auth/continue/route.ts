import { NextResponse } from "next/server"

import { ensureProfile } from "@/lib/auth/profile"
import { homeForRole } from "@/lib/auth/roles"
import { safeNextPath } from "@/lib/auth/paths"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const next = safeNextPath(url.searchParams.get("next"))
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin))
  }

  try {
    const role = await ensureProfile(user)
    return NextResponse.redirect(new URL(next ?? homeForRole(role), url.origin))
  } catch (error) {
    console.error(error)
    return NextResponse.redirect(new URL("/login?error=auth", url.origin))
  }
}
