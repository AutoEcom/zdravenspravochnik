"use server"

import { revalidatePath } from "next/cache"

import { checkedSlugValues, slugOptions } from "@/app/admin/profiles/query"
import { getSessionProfile } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCities, getSpecialties } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"
import type { DoctorUpdate, FacilityType, FacilityUpdate, PublishStatus } from "@/types/database"

export type ProfileFormState = { ok: boolean; message: string } | null

const statuses = new Set<PublishStatus>(["draft", "published", "archived"])
const facilityTypes = new Set<FacilityType>(["hospital", "clinic", "practice", "laboratory", "pharmacy", "other"])

function textValue(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max)
}

function flag(formData: FormData, key: string) {
  return formData.get(key) === "on"
}

function slugList(formData: FormData, key: string) {
  return [...new Set(formData.getAll(key).map((value) => String(value).trim()).filter((value) => value && value.length <= 80 && !/[,{}()"\\]/.test(value)))].slice(0, 40)
}

function optionalEmail(value: string) {
  if (!value) return { value: null as string | null }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: "Имейлът не е валиден." }
  return { value }
}

function optionalWebsite(value: string) {
  if (!value) return { value: null as string | null }
  if (!/^https?:\/\/\S+$/i.test(value)) return { error: "Уебсайтът трябва да започва с http:// или https://." }
  return { value }
}

async function storedSlugs(requested: string[], current: string[], mode: "city" | "specialty") {
  const rows = mode === "city" ? await safeQuery(getCities, []) : await safeQuery(getSpecialties, [])
  return checkedSlugValues(slugOptions(rows, current, mode), requested, current)
}

export async function saveProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const { user, profile } = await getSessionProfile()
  if (!user || profile?.role !== "admin") return { ok: false, message: "Само администратор може да редактира профили." }

  const kind = String(formData.get("kind") ?? "")
  const id = String(formData.get("id") ?? "").trim()
  if ((kind !== "doctor" && kind !== "facility") || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, message: "Профилът не е намерен." }
  }

  const name = textValue(formData, "name", 200)
  const title = textValue(formData, "title", 120)
  const shortDescription = textValue(formData, "short_description", 600)
  const description = textValue(formData, "description", 20000)
  const phone = textValue(formData, "phone", 40)
  const email = optionalEmail(textValue(formData, "email", 160))
  const website = optionalWebsite(textValue(formData, "website", 300))
  const address = textValue(formData, "address", 300)
  const statusValue = String(formData.get("status") ?? "")
  const status = statuses.has(statusValue as PublishStatus) ? (statusValue as PublishStatus) : null
  const requestedCities = slugList(formData, "cities")
  const requestedSpecialties = slugList(formData, "specialties")

  if (!name) return { ok: false, message: kind === "doctor" ? "Въведете име." : "Въведете име на заведението." }
  if (!status) return { ok: false, message: "Изберете статус." }
  if ("error" in email && email.error) return { ok: false, message: email.error }
  if ("error" in website && website.error) return { ok: false, message: website.error }

  const admin = createAdminClient()
  const shared = {
    short_description: shortDescription || null,
    phone: phone || null,
    email: email.value,
    website: website.value,
    address: address || null,
    accepts_nhif: flag(formData, "accepts_nhif"),
    accepts_children: flag(formData, "accepts_children"),
    online_consultation: flag(formData, "online_consultation"),
    is_featured: flag(formData, "is_featured"),
    status,
  }

  if (kind === "doctor") {
    const { data: current, error: loadError } = await admin
      .from("doctors")
      .select("id, slug, cities, specialties")
      .eq("id", id)
      .maybeSingle()
    if (loadError || !current) return { ok: false, message: "Профилът не е намерен." }

    const payload: DoctorUpdate = {
      ...shared,
      title: title || null,
      full_name: name,
      bio: description || null,
      cities: await storedSlugs(requestedCities, current.cities ?? [], "city"),
      specialties: await storedSlugs(requestedSpecialties, current.specialties ?? [], "specialty"),
    }
    const { error } = await admin.from("doctors").update(payload).eq("id", id)
    if (error) return { ok: false, message: "Записът не мина." }
    revalidateProfile(current.slug)
    return { ok: true, message: "Профилът е запазен." }
  }

  const facilityTypeValue = String(formData.get("facility_type") ?? "")
  if (!facilityTypes.has(facilityTypeValue as FacilityType)) {
    return { ok: false, message: "Изберете тип заведение." }
  }

  const { data: current, error: loadError } = await admin
    .from("facilities")
    .select("id, slug, cities, specialties")
    .eq("id", id)
    .maybeSingle()
  if (loadError || !current) return { ok: false, message: "Профилът не е намерен." }

  const payload: FacilityUpdate = {
    ...shared,
    name,
    facility_type: facilityTypeValue as FacilityType,
    description: description || null,
    cities: await storedSlugs(requestedCities, current.cities ?? [], "city"),
    specialties: await storedSlugs(requestedSpecialties, current.specialties ?? [], "specialty"),
  }
  const { error } = await admin.from("facilities").update(payload).eq("id", id)
  if (error) return { ok: false, message: "Записът не мина." }
  revalidateProfile(current.slug)
  return { ok: true, message: "Профилът е запазен." }
}

function revalidateProfile(slug: string) {
  revalidatePath("/admin/profiles")
  revalidatePath(`/${slug}`)
  revalidatePath("/specialisti")
  revalidatePath("/zavedenia")
  revalidatePath("/search")
  revalidatePath("/")
  revalidatePath("/sitemap.xml")
}
