import { claimCodeExpiry, codesMatch, createClaimCode, emailsMatch, hashClaimCode, normalizeEmail } from "@/lib/claims/codes"
import { friendlyDbError } from "@/lib/claims/errors"
import { deliverClaimCode } from "@/lib/claims/mail"
import { getSessionProfile } from "@/lib/auth/session"
import { isUserRole, roleAfterClaim } from "@/lib/auth/roles"
import { createAdminClient } from "@/lib/supabase/admin"
import { displayName } from "@/lib/content/present"
import type { ClaimTargetType, UserRole } from "@/types/database"

export type ClaimPurpose = "claim" | "review"

export type ClaimSearchHit = {
  id: string
  slug: string
  name: string
  meta: string
  claimed: boolean
}

export type StartClaimResult =
  | { status: "claimed" }
  | { status: "owned" }
  | {
      status: "code_sent"
      requestId: string
      purpose: ClaimPurpose
      simulatedCode?: string
      message?: string
    }
  | { status: "error"; message: string }

export type ConfirmClaimResult =
  | { status: "claimed" }
  | { status: "pending" }
  | { status: "error"; message: string }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function cleanQuery(value: string) {
  return value.trim().replace(/[%_,().]/g, " ").replace(/\s+/g, " ").slice(0, 80)
}

function asRole(value: string | null | undefined): UserRole {
  return isUserRole(value) ? value : "patient"
}

async function requireUser() {
  const { user, profile } = await getSessionProfile()
  if (!user) return { error: "Влезте в профила си, за да продължите." as const }
  return { user, profile }
}

export async function searchClaimTargets(
  targetType: string,
  query: string
): Promise<{ hits: ClaimSearchHit[] } | { error: string }> {
  const session = await requireUser()
  if ("error" in session) {
    return { error: session.error ?? "Влезте в профила си, за да продължите." }
  }
  if (targetType !== "doctor" && targetType !== "facility") {
    return { error: "Изберете лекар или заведение." }
  }

  const safe = cleanQuery(query)
  if (safe.length < 2) return { hits: [] }

  const admin = createAdminClient()
  const pattern = `%${safe}%`

  if (targetType === "doctor") {
    const { data, error } = await admin
      .from("doctors")
      .select("id, slug, full_name, title, cities, is_claimed")
      .eq("status", "published")
      .or(`full_name.ilike.${pattern},slug.ilike.${pattern}`)
      .order("full_name")
      .limit(8)

    if (error) {
      console.error(error)
      return { error: friendlyDbError(error) }
    }

    return {
      hits: (data ?? []).map((row) => ({
        id: row.id,
        slug: row.slug,
        name: displayName(row.title, row.full_name),
        meta: row.cities[0] ?? row.slug,
        claimed: row.is_claimed,
      })),
    }
  }

  const { data, error } = await admin
    .from("facilities")
    .select("id, slug, name, cities, is_claimed")
    .eq("status", "published")
    .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
    .order("name")
    .limit(8)

  if (error) {
    console.error(error)
    return { error: friendlyDbError(error) }
  }

  return {
    hits: (data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      meta: row.cities[0] ?? row.slug,
      claimed: row.is_claimed,
    })),
  }
}

function claimSlug(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  try {
    return decodeURIComponent(trimmed).normalize("NFC")
  } catch {
    return trimmed.normalize("NFC")
  }
}

export async function findClaimTargetBySlug(
  targetType: ClaimTargetType,
  slug: string,
): Promise<ClaimSearchHit | null> {
  const safe = claimSlug(slug)
  if (!safe || (targetType !== "doctor" && targetType !== "facility")) return null
  const admin = createAdminClient()

  if (targetType === "doctor") {
    const { data, error } = await admin
      .from("doctors")
      .select("id, slug, full_name, title, cities, is_claimed")
      .eq("status", "published")
      .eq("slug", safe)
      .maybeSingle()
    if (error || !data) return null
    return {
      id: data.id,
      slug: data.slug,
      name: displayName(data.title, data.full_name),
      meta: data.cities[0] ?? data.slug,
      claimed: data.is_claimed,
    }
  }

  const { data, error } = await admin
    .from("facilities")
    .select("id, slug, name, cities, is_claimed")
    .eq("status", "published")
    .eq("slug", safe)
    .maybeSingle()
  if (error || !data) return null
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    meta: data.cities[0] ?? data.slug,
    claimed: data.is_claimed,
  }
}

async function loadTarget(targetType: ClaimTargetType, targetId: string) {
  const admin = createAdminClient()
  if (targetType === "doctor") {
    const { data, error } = await admin
      .from("doctors")
      .select("id, email, is_claimed, claimed_by, slug")
      .eq("id", targetId)
      .maybeSingle()
    return { data, error }
  }

  const { data, error } = await admin
    .from("facilities")
    .select("id, email, is_claimed, claimed_by, slug")
    .eq("id", targetId)
    .maybeSingle()
  return { data, error }
}

async function completeClaim(userId: string, currentRole: UserRole, targetType: ClaimTargetType, targetId: string) {
  const admin = createAdminClient()
  const target = await loadTarget(targetType, targetId)
  if (target.error) return { ok: false as const, message: friendlyDbError(target.error) }
  if (!target.data) return { ok: false as const, message: "Профилът не е намерен." }
  if (target.data.is_claimed && target.data.claimed_by && target.data.claimed_by !== userId) {
    return { ok: false as const, message: "Този профил вече е потвърден от друг потребител." }
  }

  const nextRole = roleAfterClaim(currentRole, targetType)

  if (targetType === "doctor") {
    const { data, error } = await admin
      .from("doctors")
      .update({ is_claimed: true, claimed_by: userId, profile_id: userId })
      .eq("id", targetId)
      .or(`claimed_by.is.null,claimed_by.eq.${userId}`)
      .select("id")
    if (error) {
      console.error(error)
      return { ok: false as const, message: friendlyDbError(error) }
    }
    if (!data?.length) {
      return { ok: false as const, message: "Този профил вече е потвърден от друг потребител." }
    }
  } else {
    const { data, error } = await admin
      .from("facilities")
      .update({ is_claimed: true, claimed_by: userId })
      .eq("id", targetId)
      .or(`claimed_by.is.null,claimed_by.eq.${userId}`)
      .select("id")
    if (error) {
      console.error(error)
      return { ok: false as const, message: friendlyDbError(error) }
    }
    if (!data?.length) {
      return { ok: false as const, message: "Този профил вече е потвърден от друг потребител." }
    }
  }

  if (nextRole !== currentRole) {
    const { error: roleError } = await admin.from("profiles").update({ role: nextRole }).eq("id", userId)
    if (roleError) {
      console.error(roleError)
      return { ok: false as const, message: friendlyDbError(roleError, "Ролята не беше обновена. Опитайте отново.") }
    }
  }

  return { ok: true as const }
}

async function savePendingRequest(input: {
  userId: string
  targetType: ClaimTargetType
  targetId: string
  email: string
}) {
  const admin = createAdminClient()
  const { data: existing, error: existingError } = await admin
    .from("claim_requests")
    .select("id")
    .eq("user_id", input.userId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("status", "pending")
    .maybeSingle()

  if (existingError) return { error: existingError }

  const requestId = existing?.id ?? crypto.randomUUID()
  const code = createClaimCode()
  const patch = {
    email: input.email,
    email_verified: false,
    code_hash: hashClaimCode(code, requestId),
    code_expires_at: claimCodeExpiry(),
  }

  if (existing) {
    const { error } = await admin.from("claim_requests").update(patch).eq("id", requestId)
    if (error) return { error }
  } else {
    const { error } = await admin.from("claim_requests").insert({
      id: requestId,
      user_id: input.userId,
      target_type: input.targetType,
      target_id: input.targetId,
      status: "pending",
      ...patch,
    })
    if (error) return { error }
  }

  return { requestId, code }
}

export async function startClaim(input: {
  targetType: string
  targetId: string
  email: string
}): Promise<StartClaimResult> {
  const session = await requireUser()
  if ("error" in session) {
    return { status: "error", message: session.error ?? "Влезте в профила си, за да продължите." }
  }

  if (input.targetType !== "doctor" && input.targetType !== "facility") {
    return { status: "error", message: "Изберете лекар или заведение." }
  }
  if (!uuidPattern.test(input.targetId)) {
    return { status: "error", message: "Изберете профил от списъка." }
  }

  const email = normalizeEmail(input.email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Въведете валиден имейл." }
  }

  const target = await loadTarget(input.targetType, input.targetId)
  if (target.error) {
    console.error(target.error)
    return { status: "error", message: friendlyDbError(target.error) }
  }
  if (!target.data) return { status: "error", message: "Профилът не е намерен." }
  if (target.data.is_claimed && target.data.claimed_by === session.user.id) {
    return { status: "owned" }
  }
  if (target.data.is_claimed && target.data.claimed_by) {
    return { status: "error", message: "Този профил вече е потвърден." }
  }

  const accountEmail = session.user.email ?? session.profile?.email
  const matchesListing = emailsMatch(email, target.data.email)
  const matchesAccount = emailsMatch(email, accountEmail)

  if (matchesListing && matchesAccount) {
    const claimed = await completeClaim(
      session.user.id,
      asRole(session.profile?.role),
      input.targetType,
      input.targetId
    )
    if (!claimed.ok) return { status: "error", message: claimed.message }

    const admin = createAdminClient()
    const { data: closed } = await admin
      .from("claim_requests")
      .update({ status: "approved", email_verified: true, code_hash: null, code_expires_at: null })
      .eq("user_id", session.user.id)
      .eq("target_type", input.targetType)
      .eq("target_id", input.targetId)
      .eq("status", "pending")
      .select("id")

    if (!closed?.length) {
      await admin.from("claim_requests").insert({
        user_id: session.user.id,
        target_type: input.targetType,
        target_id: input.targetId,
        email,
        status: "approved",
        email_verified: true,
      })
    }

    return { status: "claimed" }
  }

  const saved = await savePendingRequest({
    userId: session.user.id,
    targetType: input.targetType,
    targetId: input.targetId,
    email,
  })
  if ("error" in saved && saved.error) {
    console.error(saved.error)
    return { status: "error", message: friendlyDbError(saved.error) }
  }
  if (!("requestId" in saved) || !saved.code) {
    return { status: "error", message: "Заявката не беше записана." }
  }

  try {
    const delivery = await deliverClaimCode(email, saved.code)
    return {
      status: "code_sent",
      requestId: saved.requestId,
      purpose: matchesListing ? "claim" : "review",
      simulatedCode: delivery.simulated ? saved.code : undefined,
    }
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : "Имейлът с кода не беше изпратен."
    return { status: "error", message }
  }
}

export async function confirmClaimCode(requestId: string, code: string): Promise<ConfirmClaimResult> {
  const session = await requireUser()
  if ("error" in session) {
    return { status: "error", message: session.error ?? "Влезте в профила си, за да продължите." }
  }
  if (!uuidPattern.test(requestId)) return { status: "error", message: "Невалидна заявка." }

  const admin = createAdminClient()
  const { data: request, error } = await admin
    .from("claim_requests")
    .select("id, user_id, target_type, target_id, email, status, code_hash, code_expires_at")
    .eq("id", requestId)
    .eq("user_id", session.user.id)
    .maybeSingle()

  if (error) {
    console.error(error)
    return { status: "error", message: friendlyDbError(error) }
  }
  if (!request || request.status !== "pending") {
    return { status: "error", message: "Заявката не е намерена." }
  }
  if (!request.code_expires_at || Date.parse(request.code_expires_at) < Date.now()) {
    return { status: "error", message: "Кодът е изтекъл. Изпратете нов." }
  }
  if (!codesMatch(code.trim(), request.id, request.code_hash)) {
    return { status: "error", message: "Кодът не е верен." }
  }

  const target = await loadTarget(request.target_type, request.target_id)
  if (target.error || !target.data) {
    return { status: "error", message: "Профилът не е намерен." }
  }

  if (emailsMatch(request.email, target.data.email)) {
    const claimed = await completeClaim(
      session.user.id,
      asRole(session.profile?.role),
      request.target_type,
      request.target_id
    )
    if (!claimed.ok) return { status: "error", message: claimed.message }

    await admin
      .from("claim_requests")
      .update({
        status: "approved",
        email_verified: true,
        code_hash: null,
        code_expires_at: null,
      })
      .eq("id", request.id)

    return { status: "claimed" }
  }

  await admin
    .from("claim_requests")
    .update({ email_verified: true, code_hash: null, code_expires_at: null })
    .eq("id", request.id)

  return { status: "pending" }
}

export async function listPendingClaims() {
  const session = await requireUser()
  if ("error" in session) {
    return { error: session.error ?? "Влезте в профила си, за да продължите." }
  }
  if (session.profile?.role !== "admin") return { error: "Нямате права за тази страница." }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("claim_requests")
    .select("id, email, target_type, target_id, email_verified, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error(error)
    return { error: friendlyDbError(error) }
  }

  const rows = data ?? []
  const doctorIds = rows.filter((row) => row.target_type === "doctor").map((row) => row.target_id)
  const facilityIds = rows.filter((row) => row.target_type === "facility").map((row) => row.target_id)

  const [doctors, facilities] = await Promise.all([
    doctorIds.length
      ? admin.from("doctors").select("id, full_name, title, slug").in("id", doctorIds)
      : Promise.resolve({ data: [], error: null }),
    facilityIds.length
      ? admin.from("facilities").select("id, name, slug").in("id", facilityIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (doctors.error || facilities.error) {
    console.error(doctors.error ?? facilities.error)
    return { error: friendlyDbError(doctors.error ?? facilities.error) }
  }

  const doctorNames = new Map(
    (doctors.data ?? []).map((row) => [row.id, displayName(row.title, row.full_name)])
  )
  const facilityNames = new Map((facilities.data ?? []).map((row) => [row.id, row.name]))

  return {
    items: rows.map((row) => ({
      id: row.id,
      email: row.email,
      targetType: row.target_type,
      targetLabel:
        row.target_type === "doctor"
          ? (doctorNames.get(row.target_id) ?? "Лекар")
          : (facilityNames.get(row.target_id) ?? "Заведение"),
      emailVerified: row.email_verified,
      createdAt: row.created_at,
    })),
  }
}

export async function decideClaim(requestId: string, decision: "approved" | "rejected") {
  const session = await requireUser()
  if ("error" in session) {
    return { ok: false as const, message: session.error ?? "Влезте в профила си, за да продължите." }
  }
  if (session.profile?.role !== "admin") return { ok: false as const, message: "Нямате права." }
  if (!uuidPattern.test(requestId)) return { ok: false as const, message: "Невалидна заявка." }

  const admin = createAdminClient()
  const { data: request, error } = await admin
    .from("claim_requests")
    .select("id, user_id, target_type, target_id, status")
    .eq("id", requestId)
    .maybeSingle()

  if (error) {
    console.error(error)
    return { ok: false as const, message: friendlyDbError(error) }
  }
  if (!request || request.status !== "pending") {
    return { ok: false as const, message: "Заявката вече е обработена." }
  }

  if (decision === "rejected") {
    const { error: rejectError } = await admin
      .from("claim_requests")
      .update({ status: "rejected", code_hash: null, code_expires_at: null })
      .eq("id", request.id)
    if (rejectError) return { ok: false as const, message: friendlyDbError(rejectError) }
    return { ok: true as const, message: "Заявката е отхвърлена." }
  }

  const { data: owner } = await admin.from("profiles").select("role").eq("id", request.user_id).maybeSingle()
  const claimed = await completeClaim(
    request.user_id,
    asRole(owner?.role),
    request.target_type,
    request.target_id
  )
  if (!claimed.ok) return claimed

  const { error: approveError } = await admin
    .from("claim_requests")
    .update({ status: "approved", email_verified: true, code_hash: null, code_expires_at: null })
    .eq("id", request.id)

  if (approveError) return { ok: false as const, message: friendlyDbError(approveError) }
  return { ok: true as const, message: "Заявката е одобрена." }
}
