import type { Metadata } from "next"
import Link from "next/link"

import { DoctorCard } from "@/components/doctors/doctor-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { GlassCard } from "@/components/ui/glass-card"
import { getSearchOptions } from "@/lib/content/catalog"
import { catalogName, placeholderDoctors } from "@/lib/content/placeholders"

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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Специалисти</p>
        <h1 className="mt-3">{name}</h1>
        <p className="mt-4 text-muted-foreground">
          Списъкът ще се напълни с публикувани профили. Дотогава може да ограничите търсенето по град.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {cities.slice(0, 6).map((city) => (
          <li key={city.slug}>
            <Link
              href={`/category/specialisti/${specialty}/${city.slug}`}
              className="inline-flex h-10 items-center rounded-full border border-primary/15 bg-white/70 px-4 text-sm transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {city.name}
            </Link>
          </li>
        ))}
      </ul>
      <ul className="grid gap-4 md:grid-cols-3">
        {placeholderDoctors.map((doctor) => (
          <li key={doctor.full_name}>
            <DoctorCard
              doctor={{
                ...doctor,
                specialties: [name],
                example: true,
              }}
            />
          </li>
        ))}
      </ul>
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
