import Link from "next/link"
import { redirect } from "next/navigation"

import { AccountShell } from "@/components/account/account-shell"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { isUserRole } from "@/lib/auth/roles"
import { getSessionProfile } from "@/lib/auth/session"
import { friendlyDbError } from "@/lib/claims/errors"
import { displayName } from "@/lib/content/present"
import { createClient } from "@/lib/supabase/server"

export const metadata = createPageMetadata({
  title: "Табло",
  description: "Редактирайте заявените лекарски профили и лечебни заведения.",
  path: "/dashboard",
  index: false,
})

export default async function DashboardPage() {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect("/login?next=/dashboard")

  const role = isUserRole(profile?.role) ? profile.role : "patient"
  const name = profile?.full_name?.trim()

  if (role === "patient") {
    return (
      <AccountShell role="patient" eyebrow="Табло" title={name ? `Здравейте, ${name}` : "Здравейте"}>
        <GlassCard variant="panel" className="grid gap-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Тук ще стоят профилите, които заявите. Започнете, като потвърдите лекар или лечебно заведение с имейла от обявата.
          </p>
          <Link href="/claim" className={buttonVariants({ className: "w-full sm:w-fit" })}>
            Заяви лекар или заведение
          </Link>
        </GlassCard>
      </AccountShell>
    )
  }
  const supabase = await createClient()
  const [doctors, facilities] = await Promise.all([
    supabase.from("doctors").select("id, slug, full_name, title").eq("claimed_by", user.id).order("full_name"),
    supabase.from("facilities").select("id, slug, name").eq("claimed_by", user.id).order("name"),
  ])

  const error = doctors.error ?? facilities.error
  const items = [
    ...(doctors.data ?? []).map((row) => ({
      id: row.id,
      kind: "doctor" as const,
      slug: row.slug,
      name: displayName(row.title, row.full_name),
      label: "Лекар",
    })),
    ...(facilities.data ?? []).map((row) => ({
      id: row.id,
      kind: "facility" as const,
      slug: row.slug,
      name: row.name,
      label: "Заведение",
    })),
  ]

  return (
    <AccountShell role={role} eyebrow="Табло" title="Вашите профили">
      {error ? (
        <GlassCard variant="panel">{friendlyDbError(error)}</GlassCard>
      ) : items.length === 0 ? (
        <GlassCard variant="panel" className="grid gap-3">
          <p className="text-sm text-muted-foreground">Все още нямате потвърден профил.</p>
          <Link href="/claim" className={buttonVariants({ className: "w-full sm:w-fit" })}>
            Заяви профил
          </Link>
        </GlassCard>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <GlassCard variant="panel" className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-xs font-medium tracking-wide text-primary uppercase">{item.label}</p>
                  <h2 className="mt-1 text-lg font-semibold">{item.name}</h2>
                </div>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex">
                  <Link
                    href={`/dashboard/${item.kind}/${item.id}`}
                    className={buttonVariants({ className: "w-full sm:w-auto" })}
                  >
                    Редакция
                  </Link>
                  <Link
                    href={`/${item.slug}`}
                    className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
                  >
                    Преглед на публичната страница
                  </Link>
                </div>
              </GlassCard>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  )
}
