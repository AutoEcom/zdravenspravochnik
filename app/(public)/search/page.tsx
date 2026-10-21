import type { Metadata } from "next"

import { DoctorCard } from "@/components/doctors/doctor-card"
import { FacilityCard } from "@/components/facilities/facility-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { SearchForm } from "@/components/search/search-form"
import { getSearchOptions, optionAliases } from "@/lib/content/catalog"
import { catalogName } from "@/lib/content/placeholders"
import { presentDoctor, presentFacility } from "@/lib/content/present"
import { searchDoctors, searchFacilities } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
    specialty?: string
    city?: string
    kind?: string
  }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const query = new URLSearchParams()
  if (params.q) query.set("q", params.q)
  if (params.specialty) query.set("specialty", params.specialty)
  if (params.city) query.set("city", params.city)
  if (params.kind) query.set("kind", params.kind)
  const search = query.toString()

  return createPageMetadata({
    title: "Търсене",
    description: "Търсете лекар или лечебно заведение по специалност, град и име.",
    path: search ? `/search?${search}` : "/search",
    index: false,
  })
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = params.q?.trim() ?? ""
  const specialty = params.specialty?.trim() ?? ""
  const city = params.city?.trim() ?? ""
  const kind = params.kind === "facility" || params.kind === "doctor" ? params.kind : ""
  const { specialties, cities } = await getSearchOptions()
  const hasFilter = Boolean(specialty || city)
  const filters = {
    specialties: optionAliases(specialties, specialty),
    cities: optionAliases(cities, city),
    query: q,
  }
  const [doctors, facilities] = hasFilter
    ? await Promise.all([
        kind === "facility" ? Promise.resolve([]) : safeQuery(() => searchDoctors(filters), []),
        kind === "doctor" ? Promise.resolve([]) : safeQuery(() => searchFacilities(filters), []),
      ])
    : [[], []]
  const specialtyName = specialty ? catalogName(specialties, specialty) : ""
  const cityName = city ? catalogName(cities, city) : ""

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-16">
      <div className="max-w-3xl">
        <h1>Търсене</h1>
        <p className="mt-4 text-muted-foreground">
          Изберете специалност или град, за да видите публикувани лекари и заведения.
        </p>
      </div>
      <SearchForm specialties={specialties} cities={cities} defaults={{ q, specialty, city, kind }} />
      <section className="flex flex-col gap-4" aria-labelledby="results-heading">
        <h2 id="results-heading">Резултати</h2>
        {hasFilter ? (
          <p className="text-sm text-muted-foreground">
            {[
              q ? `Текст: ${q}` : null,
              specialtyName ? `Специалност: ${specialtyName}` : null,
              cityName ? `Град: ${cityName}` : null,
              kind === "facility" ? "Заведения" : null,
              kind === "doctor" ? "Лекари" : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : (
          <p className="text-muted-foreground">Изберете специалност или град</p>
        )}
        {hasFilter && doctors.length + facilities.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <li key={`doctor-${doctor.id}`}>
                <DoctorCard doctor={presentDoctor(doctor, specialties, cities)} />
              </li>
            ))}
            {facilities.map((facility) => (
              <li key={`facility-${facility.id}`}>
                <FacilityCard facility={presentFacility(facility, specialties, cities)} />
              </li>
            ))}
          </ul>
        ) : null}
        {hasFilter && doctors.length + facilities.length === 0 ? (
          <p className="text-muted-foreground">Няма публикувани профили за този избор.</p>
        ) : null}
      </section>
    </main>
  )
}
