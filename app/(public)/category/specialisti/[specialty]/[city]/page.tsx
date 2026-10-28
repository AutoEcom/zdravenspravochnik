import type { Metadata } from "next"
import Link from "next/link"

import { DoctorCard } from "@/components/doctors/doctor-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getSearchOptions } from "@/lib/content/catalog"
import { catalogName } from "@/lib/content/placeholders"
import { presentDoctor } from "@/lib/content/present"
import { getDoctorsBySpecialtyAndCity } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

type SpecialtyCityPageProps = {
  params: Promise<{ specialty: string; city: string }>
}

export async function generateMetadata({
  params,
}: SpecialtyCityPageProps): Promise<Metadata> {
  const { specialty, city } = await params
  const { specialties, cities } = await getSearchOptions()
  const specialtyName = catalogName(specialties, specialty)
  const cityName = catalogName(cities, city)

  return createPageMetadata({
    title: `${specialtyName} в ${cityName}`,
    description: `Лекари по ${specialtyName.toLowerCase()} в ${cityName}. Профили и контакти от Здравен справочник.`,
    path: `/category/specialisti/${specialty}/${city}`,
  })
}

export default async function SpecialtyCityListingPage({ params }: SpecialtyCityPageProps) {
  const { specialty, city } = await params
  const { specialties, cities } = await getSearchOptions()
  const specialtyName = catalogName(specialties, specialty)
  const cityName = catalogName(cities, city)
  const doctors = await safeQuery(
    () => getDoctorsBySpecialtyAndCity(specialty, city),
    []
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">
          <Link href={`/category/specialisti/${specialty}`} className="hover:underline">
            {specialtyName}
          </Link>
        </p>
        <h1 className="mt-3">
          {specialtyName} в {cityName}
        </h1>
        <p className="mt-4 text-muted-foreground">
          Публикувани специалисти за тази комбинация от специалност и град.
        </p>
      </div>
      {doctors.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-3">
            {doctors.map((doctor) => (
              <li key={doctor.id}>
                <DoctorCard doctor={presentDoctor(doctor, specialties, cities)} />
              </li>
            ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Все още няма публикувани профили за тази специалност и град.</p>
      )}
    </main>
  )
}
