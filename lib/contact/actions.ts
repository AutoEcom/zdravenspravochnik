"use server"

import { headers } from "next/headers"

import { deliverContactMessage, type ContactKind } from "@/lib/contact/send"

const kinds = new Set<ContactKind>(["partner", "general", "about"])
const budgets = new Set(["до 200 €", "200–500 €", "500+ €", "Ще уточним"])

const hits = new Map<string, number[]>()

export type ContactInput = {
  kind: string
  name: string
  phone: string
  email: string
  organization?: string
  budget?: string
  message?: string
  company?: string
}

function clip(value: string | undefined, max: number) {
  return (value ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
}

function paragraph(value: string | undefined, max: number) {
  return (value ?? "").replace(/\r\n/g, "\n").trim().slice(0, max)
}

function limited(key: string) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < 10 * 60 * 1000)
  if (recent.length >= 5) {
    hits.set(key, recent)
    return true
  }
  recent.push(now)
  hits.set(key, recent)
  return false
}

export async function submitContact(input: ContactInput): Promise<{ ok: true } | { ok: false; error: string }> {
  if (clip(input.company, 200)) return { ok: true }
  if (!kinds.has(input.kind as ContactKind)) return { ok: false, error: "Запитването не беше прието." }

  const kind = input.kind as ContactKind
  const name = clip(input.name, 120)
  const phone = clip(input.phone, 40)
  const email = clip(input.email, 160)
  const organization = clip(input.organization, 160)
  const budget = clip(input.budget, 40)
  const message = paragraph(input.message, 2000)

  if (!name || !phone || !email) return { ok: false, error: "Въведете име, телефон и имейл." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Имейлът не е валиден." }
  if ((phone.match(/\d/g) ?? []).length < 6) return { ok: false, error: "Въведете телефон за връзка." }
  if (kind !== "partner" && !message) return { ok: false, error: "Въведете съобщение." }
  if (kind === "partner" && budget && !budgets.has(budget)) return { ok: false, error: "Изберете бюджет от списъка." }

  const headerStore = await headers()
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  if (limited(`${ip}:${kind}`)) {
    return { ok: false, error: "Изпратихте няколко съобщения за кратко. Опитайте след малко." }
  }

  try {
    await deliverContactMessage({
      kind,
      name,
      phone,
      email,
      organization,
      budget: kind === "partner" ? budget : "",
      message,
    })
  } catch (error) {
    const text = error instanceof Error ? error.message : "Имейлът не беше изпратен."
    return { ok: false, error: text }
  }

  return { ok: true }
}
