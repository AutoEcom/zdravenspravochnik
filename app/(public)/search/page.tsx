import type { Metadata } from "next"

import { DoctorCard } from "@/components/doctors/doctor-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { SearchForm } from "@/components/search/search-form"
import { getSearchOptions } from "@/lib/content/catalog"
import { catalogName } from "@/lib/content/placeholders"
import { presentDoctor } from "@/lib/content/present"
import { getDoctorsBySpecialtyAndCity } from "@/lib/supabase/queries"
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
  const kind = params.kind?.trim() ?? ""
  const { specialties, cities } = await getSearchOptions()
  const doctors =
    specialty && city
      ? await safeQuery(() => getDoctorsBySpecialtyAndCity(specialty, city), [])
      : []
  const specialtyName = specialty ? catalogName(specialties, specialty) : ""
  const cityName = city ? catalogName(cities, city) : ""

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:py-16">
      <div className="max-w-3xl">
        <h1>Търсене</h1>
        <p className="mt-4 text-muted-foreground">
          Комбинирайте специалност и град, за да видите публикувани лекари. Свободният текст се запазва в адреса.
        </p>
      </div>
      <SearchForm
        specialties={specialties}
        cities={cities}
        defaults={{ q, specialty, city }}
      />
      <section className="flex flex-col gap-4" aria-labelledby="results-heading">
        <h2 id="results-heading">Резултати</h2>
        <p className="text-sm text-muted-foreground">
          {[
            q ? `Текст: ${q}` : null,
            specialtyName ? `Специалност: ${specialtyName}` : null,
            cityName ? `Град: ${cityName}` : null,
            kind === "facility" ? "Заведения" : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Няма избрани филтри."}
        </p>
        {specialty && city && doctors.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-3">
            {doctors.map((doctor) => (
              <li key={doctor.id}>
                <DoctorCard doctor={presentDoctor(doctor, specialties, cities)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            {specialty && city
              ? "Няма публикувани лекари за тази специалност и град."
              : "Изберете специалност и град, за да заредите профили от справочника."}
          </p>
        )}
      </section>
    </main>
  )
}
