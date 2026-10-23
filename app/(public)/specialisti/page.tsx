import type { Metadata } from "next"
import Link from "next/link"

import { DoctorCard } from "@/components/doctors/doctor-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { ListingHint } from "@/components/search/listing-hint"
import { ListingPagination } from "@/components/search/listing-pagination"
import { SearchForm } from "@/components/search/search-form"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { getSearchOptions, optionAliases } from "@/lib/content/catalog"
import { dedupeProfiles } from "@/lib/content/dedupe"
import { formatCount, parsePage, withPage } from "@/lib/content/listing"
import { catalogName } from "@/lib/content/placeholders"
import { presentDoctor } from "@/lib/content/present"
import { cleanSearchText, searchDoctors } from "@/lib/supabase/queries/search"
import { safeQuery } from "@/lib/supabase/safe"
import type { Doctor } from "@/types/database"

type PageProps = {
  searchParams: Promise<{ q?: string; specialty?: string; city?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const page = parsePage(params.page)
  const filters = { q: params.q, specialty: params.specialty, city: params.city }
  const filtered = Boolean(params.q || params.specialty || params.city || page > 1)

  return createPageMetadata({
    title: page > 1 ? `Специалисти — страница ${page}` : "Специалисти",
    description: "Публикувани лекари по специалност, град и име.",
    path: withPage("/specialisti", filters, page),
    index: !filtered,
  })
}

function doctorIdentity(row: Doctor, cities: Parameters<typeof catalogName>[0]) {
  return {
    slug: row.slug,
    name: row.full_name,
    city: catalogName(cities, row.cities[0] ?? ""),
    phone: row.phone,
    is_claimed: row.is_claimed,
    is_featured: row.is_featured,
    source: row.source,
  }
}

export default async function SpecialistsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const q = cleanSearchText(params.q)
  const specialty = params.specialty?.trim() ?? ""
  const city = params.city?.trim() ?? ""
  const page = parsePage(params.page)
  const filters = { q, specialty, city }
  const { specialties, cities } = await getSearchOptions()
  const result = await safeQuery(
    () =>
      searchDoctors({
        specialties: optionAliases(specialties, specialty),
        cities: optionAliases(cities, city),
        query: q,
        page,
      }),
    { rows: [], total: 0 },
  )
  const doctors = dedupeProfiles(result.rows, (row) => doctorIdentity(row, cities))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-14">
      <div className="max-w-3xl">
        <h1>Специалисти</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">Публикувани лекари по специалност, град и име.</p>
      </div>
      <ListingHint />
      <SearchForm action="/specialisti" specialties={specialties} cities={cities} defaults={{ q, specialty, city }} />
      <p className="text-sm font-medium">
        Намерени <span className="tabular-nums">{formatCount(result.total)}</span> специалисти
      </p>
      {doctors.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <li key={doctor.id}>
              <DoctorCard doctor={presentDoctor(doctor, specialties, cities)} />
            </li>
          ))}
        </ul>
      ) : (
        <GlassCard className="flex flex-col items-start gap-4">
          <p>{result.total > 0 ? "Няма профили на тази страница." : "Няма публикувани профили за този избор."}</p>
          <Link href={withPage("/search", filters, 1)} className={buttonVariants({ variant: "outline" })}>
            Към търсенето
          </Link>
        </GlassCard>
      )}
      <ListingPagination page={page} total={result.total} path="/specialisti" params={filters} />
    </main>
  )
}
