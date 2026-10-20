"use server"

import { confirmClaimCode, searchClaimTargets, startClaim } from "@/lib/claims/service"

export async function searchProfiles(targetType: string, query: string) {
  return searchClaimTargets(targetType, query)
}

export async function submitClaim(input: { targetType: string; targetId: string; email: string }) {
  return startClaim(input)
}

export async function verifyClaimCode(requestId: string, code: string) {
  return confirmClaimCode(requestId, code)
}
