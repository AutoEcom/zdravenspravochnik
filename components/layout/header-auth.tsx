"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"

import { isUserRole } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { UserRole } from "@/types/database"

type SessionView =
  | { status: "loading" }
  | { status: "out" }
  | {
      status: "in"
      role: UserRole
      label: string
      initials: string
      hasClaims: boolean
    }

const itemClass = "min-h-11 rounded-xl px-3 text-sm"

function initialsFrom(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toLocaleUpperCase("bg")
  }
  if (parts[0]) return parts[0].slice(0, 2).toLocaleUpperCase("bg")
  const local = email.split("@")[0] ?? ""
  return (local.slice(0, 2) || "ЗС").toLocaleUpperCase("bg")
}

export function HeaderAuth() {
  const [session, setSession] = useState<SessionView>({ status: "loading" })

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function showUser(user: User) {
      const metadataName =
        typeof user.user_metadata.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user.user_metadata.name === "string"
            ? user.user_metadata.name
            : ""
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", user.id)
        .maybeSingle()

      const role = isUserRole(profile?.role) ? profile.role : "patient"
      let hasClaims = false
      if (role === "doctor" || role === "facility_admin") {
        const [doctors, facilities] = await Promise.all([
          supabase.from("doctors").select("id", { count: "exact", head: true }).eq("claimed_by", user.id),
          supabase.from("facilities").select("id", { count: "exact", head: true }).eq("claimed_by", user.id),
        ])
        hasClaims = (doctors.count ?? 0) + (facilities.count ?? 0) > 0
      }

      if (!active) return
      const name = profile?.full_name?.trim() || metadataName.trim()
      const email = profile?.email || user.email || ""
      setSession({
        status: "in",
        role,
        label: name || email,
        initials: initialsFrom(name, email),
        hasClaims,
      })
    }

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!next?.user || event === "SIGNED_OUT") {
        if (active) setSession({ status: "out" })
        return
      }
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED"
      ) {
        const current = next.user
        window.setTimeout(() => {
          if (active) void showUser(current)
        }, 0)
      }
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  if (session.status === "loading") {
    return <span aria-hidden className="size-11 rounded-full bg-primary/15" />
  }

  if (session.status === "out") {
    return (
      <Link
        href="/login"
        className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Вход
      </Link>
    )
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Меню на профила"
        className="inline-flex size-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {session.initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-panel min-w-56 rounded-2xl p-2">
        <DropdownMenuLabel className="px-3 py-2 text-sm font-medium text-foreground">
          {session.label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} render={<Link href="/dashboard" />}>
          Табло
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} render={<Link href="/claim" />}>
          Заяви профил
        </DropdownMenuItem>
        {session.role === "doctor" || session.role === "facility_admin" ? (
          session.hasClaims ? (
            <DropdownMenuItem className={itemClass} render={<Link href="/dashboard" />}>
              Моите профили
            </DropdownMenuItem>
          ) : null
        ) : null}
        {session.role === "admin" ? (
          <DropdownMenuItem className={itemClass} render={<Link href="/admin" />}>
            Админ
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem className={itemClass} render={<Link href="/dashboard/settings" />}>
          Настройки
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} onClick={signOut}>
          Изход
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
