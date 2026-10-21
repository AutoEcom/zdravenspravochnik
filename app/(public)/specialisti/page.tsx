import type { Metadata } from "next"
import Link from "next/link"

import { DoctorCard } from "@/components/doctors/doctor-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { buttonVariants } from "@/components/ui/button"
import { getSearchOptions } from "@/lib/content/catalog"
import { presentDoctor } from "@/lib/content/present"
import { getPublishedDoctors } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

export const metadata: Metadata = createPageMetadata({
  title: "Специалисти",
  description: "Публикувани лекари в Здравен справочник. Отворете търсенето, за да филтрирате по специалност и град.",
  path: "/specialisti",
})

export default async function SpecialistsPage() {
  const [{ specialties, cities }, doctors] = await Promise.all([
    getSearchOptions(),
    safeQuery(() => getPublishedDoctors(9), []),
  ])

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1>Специалисти</h1>
          <p className="mt-3 text-muted-foreground">
            Подбрани публикувани профили. За пълен списък по специалност и град използвайте търсенето.
          </p>
        </div>
        <Link href="/search" className={buttonVariants({ variant: "accent", className: "w-full sm:w-auto" })}>
          Към търсенето
        </Link>
      </div>
      {doctors.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <li key={doctor.id}>
              <DoctorCard doctor={presentDoctor(doctor, specialties, cities)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Все още няма публикувани лекари.</p>
      )}
    </main>
  )
}
