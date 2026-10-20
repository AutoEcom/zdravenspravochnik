import { redirect } from "next/navigation"

import { ClaimForm } from "@/app/claim/claim-form"
import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getSessionProfile } from "@/lib/auth/session"
import { isUserRole } from "@/lib/auth/roles"

export const metadata = createPageMetadata({
  title: "Заяви профил",
  description: "Потвърдете лекарски профил или лечебно заведение с имейл.",
  path: "/claim",
  index: false,
})

export default async function ClaimPage() {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect("/login?next=/claim")

  return (
    <AccountShell
      role={isUserRole(profile?.role) ? profile.role : "patient"}
      eyebrow="Профил"
      title="Заявете лекар или заведение"
    >
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        Търсете по име или slug. Имейлът, с който сте влезли, потвърждава профила веднага, ако съвпада с публикувания.
      </p>
      <ClaimForm />
    </AccountShell>
  )
}
