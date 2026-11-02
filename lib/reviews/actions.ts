"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

function usesGoogle(user: User) {
  const provider = user.app_metadata?.provider
  return provider === "google" || (user.identities ?? []).some((identity) => identity.provider === "google")
}

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !usesGoogle(user)) {
    return { ok: false, message: "Отзиви могат да оставят потребители, влезли с Google." }
  }

  const rating = Number(formData.get("rating"))
  const comment = String(formData.get("comment") ?? "").trim()
  const doctorId = String(formData.get("doctor_id") ?? "").trim()
  const facilityId = String(formData.get("facility_id") ?? "").trim()
  const slug = String(formData.get("slug") ?? "").trim()
  const target = doctorId ? { column: "doctor_id" as const, id: doctorId } : facilityId ? { column: "facility_id" as const, id: facilityId } : null

  if (!target || !/^[0-9a-f-]{36}$/i.test(target.id)) return { ok: false, message: "Профилът не е намерен." }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, message: "Изберете оценка от 1 до 5." }
  if (comment.length < 10 || comment.length > 1000) return { ok: false, message: "Отзивът трябва да е между 10 и 1000 знака." }

  const admin = createAdminClient()
  const existing = await admin.from("reviews").select("id").eq("author_id", user.id).eq(target.column, target.id).maybeSingle()
  if (existing.error) return { ok: false, message: "Отзивът не се записа." }
  if (existing.data) return { ok: false, message: "Вече сте оставили отзив за този профил." }

  const { error } = await admin.from("reviews").insert({
    author_id: user.id,
    rating,
    comment,
    status: "published",
    doctor_id: target.column === "doctor_id" ? target.id : null,
    facility_id: target.column === "facility_id" ? target.id : null,
  })
  if (error) return { ok: false, message: "Отзивът не се записа." }

  if (slug) revalidatePath(`/${slug}`)
  return { ok: true, message: "Отзивът е публикуван." }
}
