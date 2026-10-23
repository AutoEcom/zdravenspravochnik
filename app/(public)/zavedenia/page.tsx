import type { Metadata } from "next"
import Link from "next/link"

import { FacilityCard } from "@/components/facilities/facility-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { ListingHint } from "@/components/search/listing-hint"
import { ListingPagination } from "@/components/search/listing-pagination"
import { SearchForm } from "@/components/search/search-form"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { getSearchOptions, optionAliases } from "@/lib/content/catalog"
import { dedupeProfiles } from "@/lib/content/dedupe"
import { facilityGroupLabel, facilityGroupOptions, parseFacilityGroup } from "@/lib/content/facility-groups"
import { formatCount, parsePage, withPage } from "@/lib/content/listing"
import { catalogName } from "@/lib/content/placeholders"
import { presentFacility } from "@/lib/content/present"
import { cleanSearchText, searchFacilities } from "@/lib/supabase/queries/search"
import { safeQuery } from "@/lib/supabase/safe"
import type { Facility } from "@/types/database"

type PageProps = {
  searchParams: Promise<{ q?: string; specialty?: string; city?: string; type?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const page = parsePage(params.page)
  const type = parseFacilityGroup(params.type)
  const filters = { q: params.q, specialty: params.specialty, city: params.city, type }
  const filtered = Boolean(params.q || params.specialty || params.city || type || page > 1)
  const group = facilityGroupLabel(type)

  return createPageMetadata({
    title: page > 1 ? `Здравни заведения — страница ${page}` : group ? `${group} — здравни заведения` : "Здравни заведения",
    description: "Болници, медицински центрове, лаборатории и дентални практики.",
    path: withPage("/zavedenia", filters, page),
    index: !filtered,
  })
}

function facilityIdentity(row: Facility, cities: Parameters<typeof catalogName>[0]) {
  return {
    slug: row.slug,
    name: row.name,
    city: catalogName(cities, row.cities[0] ?? ""),
    phone: row.phone,
    is_claimed: row.is_claimed,
    is_featured: row.is_featured,
    source: row.source,
  }
}

export default async function FacilitiesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const q = cleanSearchText(params.q)
  const specialty = params.specialty?.trim() ?? ""
  const city = params.city?.trim() ?? ""
  const type = parseFacilityGroup(params.type)
  const page = parsePage(params.page)
  const filters = { q, specialty, city, type }
  const { specialties, cities } = await getSearchOptions()
  const result = await safeQuery(
    () =>
      searchFacilities({
        specialties: optionAliases(specialties, specialty),
        cities: optionAliases(cities, city),
        query: q,
        page,
        facilityGroup: type,
      }),
    { rows: [], total: 0 },
  )
  const facilities = dedupeProfiles(result.rows, (row) => facilityIdentity(row, cities))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-14">
      <div className="max-w-3xl">
        <h1>Здравни заведения</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Болници, медицински центрове, лаборатории и дентални практики.
        </p>
      </div>
      <ListingHint />
      <SearchForm
        action="/zavedenia"
        specialties={specialties}
        cities={cities}
        facilityTypes={facilityGroupOptions}
        defaults={{ q, specialty, city, type }}
      />
      <p className="text-sm font-medium">
        Намерени <span className="tabular-nums">{formatCount(result.total)}</span> здравни заведения
      </p>
      {facilities.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <li key={facility.id}>
              <FacilityCard facility={presentFacility(facility, specialties, cities)} />
            </li>
          ))}
        </ul>
      ) : (
        <GlassCard className="flex flex-col items-start gap-4">
          <p>{result.total > 0 ? "Няма профили на тази страница." : "Няма публикувани профили за този избор."}</p>
          <Link href={withPage("/search", { q, specialty, city }, 1)} className={buttonVariants({ variant: "outline" })}>
            Към търсенето
          </Link>
        </GlassCard>
      )}
      <ListingPagination page={page} total={result.total} path="/zavedenia" params={filters} />
    </main>
  )
}
