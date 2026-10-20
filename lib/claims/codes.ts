import { createHash, randomInt, timingSafeEqual } from "node:crypto"

const CODE_TTL_MS = 15 * 60 * 1000

export function createClaimCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

export function hashClaimCode(code: string, requestId: string) {
  return createHash("sha256").update(`${requestId}:${code}`).digest("hex")
}

export function claimCodeExpiry(from = Date.now()) {
  return new Date(from + CODE_TTL_MS).toISOString()
}

export function codesMatch(input: string, requestId: string, storedHash: string | null) {
  if (!storedHash || !/^\d{6}$/.test(input)) return false
  const next = hashClaimCode(input, requestId)
  const left = Buffer.from(next)
  const right = Buffer.from(storedHash)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function emailsMatch(left: string | null | undefined, right: string | null | undefined) {
  if (!left || !right) return false
  return normalizeEmail(left) === normalizeEmail(right)
}
