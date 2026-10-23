import { redirect } from "next/navigation"

import { ClaimForm } from "@/app/claim/claim-form"
import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getSessionProfile } from "@/lib/auth/session"
import { isUserRole } from "@/lib/auth/roles"
import { findClaimTargetBySlug } from "@/lib/claims/service"
import type { ClaimTargetType } from "@/types/database"

export const metadata = createPageMetadata({
  title: "Заяви профил",
  description: "Потвърдете лекарски профил или лечебно заведение с имейл.",
  path: "/claim",
  index: false,
})

type ClaimPageProps = {
  searchParams: Promise<{ slug?: string; type?: string }>
}

export default async function ClaimPage({ searchParams }: ClaimPageProps) {
  const params = await searchParams
  const slug = params.slug?.trim() ?? ""
  const requested: ClaimTargetType | "" = params.type === "facility" ? "facility" : params.type === "doctor" ? "doctor" : ""
  const next = new URLSearchParams()
  if (requested) next.set("type", requested)
  if (slug) next.set("slug", slug)
  const nextPath = next.size ? `/claim?${next.toString()}` : "/claim"

  const { user, profile } = await getSessionProfile()
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`)

  let targetType: ClaimTargetType = requested || "doctor"
  let initial = null
  if (slug && requested) {
    initial = await findClaimTargetBySlug(requested, slug)
  } else if (slug) {
    initial = await findClaimTargetBySlug("doctor", slug)
    if (!initial) {
      initial = await findClaimTargetBySlug("facility", slug)
      if (initial) targetType = "facility"
    }
  }

  return (
    <AccountShell
      role={isUserRole(profile?.role) ? profile.role : "patient"}
      eyebrow="Профил"
      title="Заявете лекар или заведение"
    >
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        Търсете по име или slug. Имейлът, с който сте влезли, потвърждава профила веднага, ако съвпада с публикувания.
      </p>
      <ClaimForm initialType={targetType} initialQuery={slug} initialHit={initial} />
    </AccountShell>
  )
}
