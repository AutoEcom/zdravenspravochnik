import type { Metadata } from "next"

import { DoctorCard } from "@/components/doctors/doctor-card"
import { FacilityCard } from "@/components/facilities/facility-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { ListingHint } from "@/components/search/listing-hint"
import { ListingPagination } from "@/components/search/listing-pagination"
import { SearchForm } from "@/components/search/search-form"
import { GlassCard } from "@/components/ui/glass-card"
import { getSearchOptions, optionAliases } from "@/lib/content/catalog"
import { dedupeProfiles } from "@/lib/content/dedupe"
import { formatCount, parsePage, withPage } from "@/lib/content/listing"
import { catalogName } from "@/lib/content/placeholders"
import { presentDoctor, presentFacility } from "@/lib/content/present"
import { cleanSearchText, searchDirectory } from "@/lib/supabase/queries/search"
import { safeQuery } from "@/lib/supabase/safe"
import type { DirectoryHit } from "@/lib/supabase/queries/search"

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
    specialty?: string
    city?: string
    kind?: string
    page?: string
  }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const page = parsePage(params.page)
  const filters = { q: params.q, specialty: params.specialty, city: params.city, kind: params.kind }

  return createPageMetadata({
    title: page > 1 ? `Търсене — страница ${page}` : "Търсене",
    description: "Търсете лекар или здравно заведение по специалност, град и име.",
    path: withPage("/search", filters, page),
    index: false,
  })
}

function hitIdentity(hit: DirectoryHit, cities: Parameters<typeof catalogName>[0]) {
  if (hit.kind === "doctor") {
    return {
      slug: hit.profile.slug,
      name: hit.profile.full_name,
      city: catalogName(cities, hit.profile.cities[0] ?? ""),
      phone: hit.profile.phone,
      is_claimed: hit.profile.is_claimed,
      is_featured: hit.profile.is_featured,
      source: hit.profile.source,
    }
  }
  return {
    slug: hit.profile.slug,
    name: hit.profile.name,
    city: catalogName(cities, hit.profile.cities[0] ?? ""),
    phone: hit.profile.phone,
    is_claimed: hit.profile.is_claimed,
    is_featured: hit.profile.is_featured,
    source: hit.profile.source,
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = cleanSearchText(params.q)
  const specialty = params.specialty?.trim() ?? ""
  const city = params.city?.trim() ?? ""
  const kind = params.kind === "facility" || params.kind === "doctor" ? params.kind : ""
  const page = parsePage(params.page)
  const filters = { q, specialty, city, kind }
  const hasFilter = Boolean(specialty || city || q)
  const { specialties, cities } = await getSearchOptions()
  const result = hasFilter
    ? await safeQuery(
        () =>
          searchDirectory({
            specialties: optionAliases(specialties, specialty),
            cities: optionAliases(cities, city),
            query: q,
            page,
            kind,
          }),
        { rows: [], total: 0 },
      )
    : { rows: [], total: 0 }
  const hits = dedupeProfiles(result.rows, (hit) => hitIdentity(hit, cities))
  const specialtyName = specialty ? catalogName(specialties, specialty) : ""
  const cityName = city ? catalogName(cities, city) : ""

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-16">
      <div className="max-w-3xl">
        <h1>Търсене</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Публикувани специалисти и здравни заведения по специалност, град и име.
        </p>
      </div>
      <ListingHint />
      <SearchForm specialties={specialties} cities={cities} defaults={{ q, specialty, city, kind }} />
      <section className="flex flex-col gap-4" aria-labelledby="results-heading">
        <h2 id="results-heading">Резултати</h2>
        {hasFilter ? (
          <>
            <p className="text-sm font-medium">
              Намерени <span className="tabular-nums">{formatCount(result.total)}</span> профила
            </p>
            <p className="text-sm text-muted-foreground">
              {[
                q ? `Текст: ${q}` : null,
                specialtyName ? `Специалност: ${specialtyName}` : null,
                cityName ? `Град: ${cityName}` : null,
                kind === "facility" ? "Здравни заведения" : null,
                kind === "doctor" ? "Специалисти" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </>
        ) : (
          <GlassCard>
            <p>Изберете специалност, град или въведете име</p>
          </GlassCard>
        )}
        {hasFilter && hits.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hits.map((hit) =>
              hit.kind === "doctor" ? (
                <li key={`doctor-${hit.profile.id}`}>
                  <DoctorCard doctor={presentDoctor(hit.profile, specialties, cities)} />
                </li>
              ) : (
                <li key={`facility-${hit.profile.id}`}>
                  <FacilityCard facility={presentFacility(hit.profile, specialties, cities)} />
                </li>
              ),
            )}
          </ul>
        ) : null}
        {hasFilter && hits.length === 0 ? (
          <GlassCard>
            <p>{result.total > 0 ? "Няма профили на тази страница." : "Няма публикувани профили за този избор."}</p>
          </GlassCard>
        ) : null}
        {hasFilter ? <ListingPagination page={page} total={result.total} path="/search" params={filters} /> : null}
      </section>
    </main>
  )
}
