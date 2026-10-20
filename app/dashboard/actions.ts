"use server"

import { revalidatePath } from "next/cache"

import { friendlyDbError } from "@/lib/claims/errors"
import { getSessionProfile } from "@/lib/auth/session"
import { canOpenDashboard } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/server"
import type { WorkingHours } from "@/types/database"

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

function textValue(formData: FormData, key: string, max: number) {
  const value = String(formData.get(key) ?? "").trim()
  if (!value) return null
  return value.slice(0, max)
}

function parseHours(formData: FormData): { hours: WorkingHours } | { error: string } {
  const hours: WorkingHours = {}
  for (const day of days) {
    const closed = formData.get(`${day}_closed`) === "on"
    const open = String(formData.get(`${day}_open`) ?? "").trim()
    const close = String(formData.get(`${day}_close`) ?? "").trim()
    const validTime = (value: string) => value === "" || /^\d{2}:\d{2}$/.test(value)
    if (!validTime(open) || !validTime(close)) {
      return { error: "Работното време трябва да е във формат ЧЧ:ММ." }
    }
    if (closed) {
      hours[day] = { closed: true, open: null, close: null }
    } else if (open || close) {
      hours[day] = { closed: false, open: open || null, close: close || null }
    }
  }
  return { hours }
}

function cleanWebsite(value: string | null) {
  if (!value) return { value: null as string | null }
  if (!/^https?:\/\//i.test(value)) {
    return { error: "Уебсайтът трябва да започва с http:// или https://." }
  }
  return { value }
}

function cleanEmail(value: string | null) {
  if (!value) return { value: null as string | null }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: "Въведете валиден имейл за профила." }
  return { value }
}

export async function updateOwnedProfile(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  const { user, profile } = await getSessionProfile()
  if (!user || !canOpenDashboard(profile?.role)) {
    return { ok: false, message: "Нямате достъп до това табло." }
  }

  const kind = String(formData.get("kind") ?? "")
  const id = String(formData.get("id") ?? "")
  if ((kind !== "doctor" && kind !== "facility") || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, message: "Невалиден профил." }
  }

  const website = cleanWebsite(textValue(formData, "website", 300))
  if ("error" in website && website.error) return { ok: false, message: website.error }
  const email = cleanEmail(textValue(formData, "email", 200))
  if ("error" in email && email.error) return { ok: false, message: email.error }
  const parsedHours = parseHours(formData)
  if (!("hours" in parsedHours)) return { ok: false, message: parsedHours.error }
  const hours = parsedHours.hours

  const shared = {
    short_description: textValue(formData, "short_description", 280),
    phone: textValue(formData, "phone", 40),
    email: email.value,
    website: website.value,
    working_hours: hours,
    accepts_nhif: formData.get("accepts_nhif") === "on",
    accepts_children: formData.get("accepts_children") === "on",
    online_consultation: formData.get("online_consultation") === "on",
  }

  const supabase = await createClient()
  if (kind === "doctor") {
    const { data: owned } = await supabase.from("doctors").select("slug").eq("id", id).eq("claimed_by", user.id).maybeSingle()
    if (!owned) return { ok: false, message: "Нямате достъп до този профил." }
    const { data, error } = await supabase
      .from("doctors")
      .update({ ...shared, bio: textValue(formData, "description", 5000) })
      .eq("id", id)
      .eq("claimed_by", user.id)
      .select("id")
    if (error) {
      console.error(error)
      return { ok: false, message: friendlyDbError(error, "Профилът не беше запазен.") }
    }
    if (!data?.length) return { ok: false, message: "Нямате достъп до този профил." }
    revalidatePath(`/${owned.slug}`)
  } else {
    const { data: owned } = await supabase
      .from("facilities")
      .select("slug")
      .eq("id", id)
      .eq("claimed_by", user.id)
      .maybeSingle()
    if (!owned) return { ok: false, message: "Нямате достъп до този профил." }
    const { data, error } = await supabase
      .from("facilities")
      .update({ ...shared, description: textValue(formData, "description", 5000) })
      .eq("id", id)
      .eq("claimed_by", user.id)
      .select("id")
    if (error) {
      console.error(error)
      return { ok: false, message: friendlyDbError(error, "Профилът не беше запазен.") }
    }
    if (!data?.length) return { ok: false, message: "Нямате достъп до този профил." }
    revalidatePath(`/${owned.slug}`)
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/${kind}/${id}`)
  return { ok: true, message: "Промените са запазени." }
}
