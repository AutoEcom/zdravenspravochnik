import type { Metadata } from "next"
import Link from "next/link"

import { CityPills } from "@/components/category/city-pills"
import { DoctorCard } from "@/components/doctors/doctor-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { GlassCard } from "@/components/ui/glass-card"
import { getSearchOptions, optionAliases } from "@/lib/content/catalog"
import { catalogName } from "@/lib/content/placeholders"
import { presentDoctor } from "@/lib/content/present"
import { specialtyCityPills } from "@/lib/content/specialty-cities"
import { getDoctorsBySpecialty, getSpecialtyDoctorCities } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

type SpecialtyPageProps = {
  params: Promise<{ specialty: string }>
}

export async function generateMetadata({ params }: SpecialtyPageProps): Promise<Metadata> {
  const { specialty } = await params
  const { specialties } = await getSearchOptions()
  const name = catalogName(specialties, specialty)

  return createPageMetadata({
    title: `${name} – специалисти`,
    description: `Лекари по ${name.toLowerCase()} в България. Прегледайте профили, градове и контакти.`,
    path: `/category/specialisti/${specialty}`,
  })
}

export default async function SpecialtyListingPage({ params }: SpecialtyPageProps) {
  const { specialty } = await params
  const { specialties, cities } = await getSearchOptions()
  const name = catalogName(specialties, specialty)
  const aliases = optionAliases(specialties, specialty)
  const [doctors, doctorCities] = await Promise.all([
    safeQuery(() => getDoctorsBySpecialty(specialty, aliases), []),
    safeQuery(() => getSpecialtyDoctorCities(specialty, aliases), []),
  ])
  const pills = specialtyCityPills(doctorCities, cities)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Специалисти</p>
        <h1 className="mt-3">{name}</h1>
        <p className="mt-4 text-muted-foreground">
          {doctors.length > 0
            ? "Публикувани профили за тази специалност. Ограничете ги по град, ако търсите наблизо."
            : "Списъкът ще се напълни с публикувани профили. Дотогава може да ограничите търсенето по град."}
        </p>
      </div>
      <CityPills specialty={specialty} cities={pills} />
      {doctors.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-3">
          {doctors.map((doctor) => (
            <li key={doctor.id}>
              <DoctorCard doctor={presentDoctor(doctor, specialties, cities)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Все още няма публикувани профили за тази специалност.</p>
      )}
      <GlassCard>
        <h2>Търсене</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Отворете търсачката, ако искате да комбинирате специалност, град и име.
        </p>
        <Link
          href={`/search?specialty=${specialty}`}
          className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Търси {name}
        </Link>
      </GlassCard>
    </main>
  )
}
