import type { Metadata } from "next"
import Link from "next/link"

import { FacilityCard } from "@/components/facilities/facility-card"
import { createPageMetadata } from "@/components/seo/page-meta"
import { buttonVariants } from "@/components/ui/button"
import { getSearchOptions } from "@/lib/content/catalog"
import { presentFacility } from "@/lib/content/present"
import { getPublishedFacilities } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

export const metadata: Metadata = createPageMetadata({
  title: "Заведения",
  description: "Публикувани лечебни заведения в Здравен справочник. Отворете търсенето, за да филтрирате по специалност и град.",
  path: "/zavedenia",
})

export default async function FacilitiesPage() {
  const [{ specialties, cities }, facilities] = await Promise.all([
    getSearchOptions(),
    safeQuery(() => getPublishedFacilities(9), []),
  ])

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1>Заведения</h1>
          <p className="mt-3 text-muted-foreground">
            Болници, центрове и лаборатории с публикуван профил. Търсенето стеснява списъка по град и специалност.
          </p>
        </div>
        <Link
          href="/search?kind=facility"
          className={buttonVariants({ variant: "accent", className: "w-full sm:w-auto" })}
        >
          Към търсенето
        </Link>
      </div>
      {facilities.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <li key={facility.id}>
              <FacilityCard facility={presentFacility(facility, specialties, cities)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Все още няма публикувани заведения.</p>
      )}
    </main>
  )
}
