"use server"

import { revalidatePath } from "next/cache"

import { decideClaim } from "@/lib/claims/service"

export async function reviewClaim(requestId: string, decision: "approved" | "rejected") {
  const result = await decideClaim(requestId, decision)
  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/dashboard")
  }
  return result
}
