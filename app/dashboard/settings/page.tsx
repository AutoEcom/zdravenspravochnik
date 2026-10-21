import { redirect } from "next/navigation"

import { AccountShell } from "@/components/account/account-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { isUserRole } from "@/lib/auth/roles"
import { getSessionProfile } from "@/lib/auth/session"

export const metadata = createPageMetadata({
  title: "Настройки",
  description: "Лични настройки на профила в Здравен справочник.",
  path: "/dashboard/settings",
  index: false,
})

export default async function DashboardSettingsPage() {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect("/login?next=/dashboard/settings")

  const role = isUserRole(profile?.role) ? profile.role : "patient"

  return (
    <AccountShell role={role} eyebrow="Профил" title="Настройки">
      <GlassCard variant="panel" className="grid gap-2">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Тук ще може да сменяте име, имейл и парола. Страницата е подготвена и още не записва промени.
        </p>
        {profile?.email ? <p className="text-sm font-medium">{profile.email}</p> : null}
      </GlassCard>
    </AccountShell>
  )
}
