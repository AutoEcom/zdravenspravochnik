import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { homeForRole, isUserRole } from "@/lib/auth/roles"
import type { Database } from "@/lib/supabase/types"
import type { UserRole } from "@/types/database"

function redirectWithSession(request: NextRequest, sessionResponse: NextResponse, pathname: string, search = "") {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = search
  const redirectResponse = NextResponse.redirect(url)
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value)
  })
  return redirectResponse
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value)
        )
      },
    },
  })

  // Do not run code between createServerClient and supabase.auth.getClaims().
  const { data } = await supabase.auth.getClaims()
  const userId = typeof data?.claims.sub === "string" ? data.claims.sub : null
  const path = request.nextUrl.pathname
  const isDashboard = path === "/dashboard" || path.startsWith("/dashboard/")
  const isAdmin = path === "/admin" || path.startsWith("/admin/")
  const isClaim = path === "/claim" || path.startsWith("/claim/")
  const isLogin = path === "/login"
  const needsSession = isDashboard || isAdmin || isClaim || (isLogin && Boolean(userId))

  if (!needsSession) return supabaseResponse

  let role: UserRole = "patient"
  if (userId) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
    if (profile && isUserRole(profile.role)) role = profile.role
  }

  if ((isDashboard || isAdmin || isClaim) && !userId) {
    const next = `${path}${request.nextUrl.search}`
    return redirectWithSession(request, supabaseResponse, "/login", `?next=${encodeURIComponent(next)}`)
  }

  if (isAdmin && role !== "admin") {
    return redirectWithSession(request, supabaseResponse, homeForRole(role))
  }

  if (isLogin && userId) {
    return redirectWithSession(request, supabaseResponse, homeForRole(role))
  }

  return supabaseResponse
}
