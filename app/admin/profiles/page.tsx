import Link from "next/link"
import { redirect } from "next/navigation"

import { listAdminProfiles, matchingCitySlugs, parseProfileKind } from "@/app/admin/profiles/query"
import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { ListingPagination } from "@/components/search/listing-pagination"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { getSessionProfile } from "@/lib/auth/session"
import { cleanDisplayName } from "@/lib/content/display-name"
import { formatCount, PAGE_SIZE, parsePage } from "@/lib/content/listing"
import { humanLabel } from "@/lib/content/normalize"
import { labelFromSlug } from "@/lib/content/placeholders"
import { displayName } from "@/lib/content/present"
import { getCities } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"
import type { PublishStatus } from "@/types/database"

export const metadata = createPageMetadata({
  title: "Профили",
  description: "Редакция на лекари и лечебни заведения.",
  path: "/admin/profiles",
  index: false,
})

const statusLabel: Record<PublishStatus, string> = {
  draft: "Чернова",
  published: "Публикуван",
  archived: "Архив",
}

const kindLabel = {
  doctor: "Лекар",
  facility: "Заведение",
} as const

const selectClass =
  "h-11 rounded-2xl border border-slate-200/80 bg-white/70 px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"

export default async function AdminProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; page?: string }>
}) {
  const params = await searchParams
  const q = params.q?.trim() ?? ""
  const kind = parseProfileKind(params.kind)
  const page = parsePage(params.page)
  const next = page > 1 || q || kind !== "all" ? `/admin/profiles?${new URLSearchParams({ ...(q ? { q } : {}), ...(kind !== "all" ? { kind } : {}), ...(page > 1 ? { page: String(page) } : {}) }).toString()}` : "/admin/profiles"

  const { user, profile } = await getSessionProfile()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  if (profile?.role !== "admin") redirect("/dashboard")

  const cities = await safeQuery(getCities, [])
  const result = await listAdminProfiles({
    query: q,
    kind,
    page,
    citySlugs: matchingCitySlugs(cities, q),
  }).catch(() => ({ error: "Списъкът не се зареди." }))

  const cityName = new Map(cities.map((city) => [city.slug, humanLabel(city.name)]))

  return (
    <AccountShell role="admin" eyebrow="Администрация" title="Профили">
      <form action="/admin/profiles" className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <Input name="q" defaultValue={q} placeholder="Име, адрес или град" aria-label="Търсене" />
        <select name="kind" defaultValue={kind} aria-label="Вид" className={selectClass}>
          <option value="all">Всички</option>
          <option value="doctor">Лекари</option>
          <option value="facility">Заведения</option>
        </select>
        <button type="submit" className={buttonVariants({ variant: "primary", className: "w-full sm:w-auto" })}>
          Търси
        </button>
      </form>

      {"error" in result ? (
        <GlassCard variant="panel">{result.error}</GlassCard>
      ) : (
        <>
          <p className="mb-3 text-sm tabular-nums text-muted-foreground">{formatCount(result.total)} резултата</p>
          {result.rows.length > 0 ? (
            <ul className="grid gap-3">
              {result.rows.map((row) => {
                const heading = row.kind === "doctor" ? displayName(row.title, row.name) : cleanDisplayName(row.name)
                const cityLine = cityText(row.cities, cityName)
                return (
                  <li key={`${row.kind}-${row.id}`}>
                    <Link href={`/admin/profiles/${row.kind}/${row.id}`} className="block">
                      <GlassCard variant="panel" className="transition-colors hover:bg-white/80">
                        <p className="text-xs font-medium text-primary">{kindLabel[row.kind]}</p>
                        <h2 className="mt-1 text-lg">{heading || row.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {`/${row.slug}${cityLine ? ` · ${cityLine}` : ""} · ${statusLabel[row.status]}`}
                        </p>
                      </GlassCard>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <GlassCard variant="panel">
              {result.total > 0 ? "Няма профили на тази страница." : "Няма профили за това търсене."}
            </GlassCard>
          )}
          <div className="mt-4">
            <ListingPagination
              page={page}
              total={result.total}
              path="/admin/profiles"
              params={{ q: q || undefined, kind: kind === "all" ? undefined : kind }}
              pageSize={PAGE_SIZE}
            />
          </div>
        </>
      )}
    </AccountShell>
  )
}

function cityText(slugs: string[], names: Map<string, string>) {
  if (slugs.length === 0) return ""
  const shown = slugs.slice(0, 2).map((slug) => names.get(slug) || labelFromSlug(slug))
  const extra = slugs.length - shown.length
  return extra > 0 ? `${shown.join(", ")} +${extra}` : shown.join(", ")
}
