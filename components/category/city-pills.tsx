import Link from "next/link"

import type { CityPill } from "@/lib/content/specialty-cities"

export function CityPills({
  specialty,
  cities,
  active,
}: {
  specialty: string
  cities: CityPill[]
  active?: string
}) {
  if (cities.length === 0) return null
  const current = active?.toLocaleLowerCase("bg")

  return (
    <ul className="flex flex-wrap gap-2">
      {cities.map((city) => {
        const selected = city.slug.toLocaleLowerCase("bg") === current
        return (
          <li key={city.slug}>
            <Link
              href={`/category/specialisti/${specialty}/${city.slug}`}
              aria-current={selected ? "page" : undefined}
              className={
                selected
                  ? "inline-flex h-10 items-center rounded-full border border-primary bg-primary px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  : "inline-flex h-10 items-center rounded-full border border-primary/15 bg-white/70 px-4 text-sm transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              }
            >
              {city.name}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
