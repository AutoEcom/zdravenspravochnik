import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

const tables = {
  doctor: "doctors",
  facility: "facilities",
  article: "articles",
} as const

type Target = keyof typeof tables

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { type?: string; id?: string } | null
  const type = body?.type
  const id = body?.id?.trim() ?? ""
  if ((type !== "doctor" && type !== "facility" && type !== "article") || !isUuid(id)) {
    return NextResponse.json({ counted: false })
  }

  const header = request.headers.get("cookie") ?? ""
  const current = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("zs-seen="))
    ?.slice("zs-seen=".length)
  const seen = new Set(decodeURIComponent(current ?? "").split(".").filter(Boolean))
  if (seen.has(id)) return NextResponse.json({ counted: false })

  const admin = createAdminClient()
  const table = tables[type as Target]
  const existing = await admin.from(table).select("view_count").eq("id", id).maybeSingle()
  if (existing.error || typeof existing.data?.view_count !== "number") {
    return NextResponse.json({ counted: false })
  }

  const updated = await admin.from(table).update({ view_count: existing.data.view_count + 1 }).eq("id", id)
  if (updated.error) return NextResponse.json({ counted: false })

  seen.add(id)
  const value = [...seen].slice(-30).join(".")
  const response = NextResponse.json({ counted: true })
  response.cookies.set("zs-seen", value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  })
  return response
}
