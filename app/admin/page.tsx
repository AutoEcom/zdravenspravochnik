import Link from "next/link"
import { redirect } from "next/navigation"

import { ClaimQueue } from "@/app/admin/claim-queue"
import { AccountShell } from "@/components/account/account-shell"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getSessionProfile } from "@/lib/auth/session"
import { listPendingClaims } from "@/lib/claims/service"

export const metadata = createPageMetadata({
  title: "Админ",
  description: "Одобряване и отхвърляне на заявки за профили.",
  path: "/admin",
  index: false,
})

export default async function AdminPage() {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect("/login?next=/admin")
  if (profile?.role !== "admin") redirect("/claim")

  const result = await listPendingClaims()

  return (
    <AccountShell role="admin" eyebrow="Администрация" title="Чакащи заявки">
      <div className="mb-4">
        <Link href="/admin/articles" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
          Статии
        </Link>
      </div>
      {"error" in result ? <GlassCard variant="panel">{result.error}</GlassCard> : <ClaimQueue items={result.items} />}
    </AccountShell>
  )
}
