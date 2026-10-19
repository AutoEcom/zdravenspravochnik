import Link from "next/link"

import { GlassCard } from "@/components/ui/glass-card"

export type FacilitySummary = {
  name: string
  facilityType: string
  specialties: readonly string[]
  cities: readonly string[]
  slug?: string
  example?: boolean
}

export function FacilityCard({ facility }: { facility: FacilitySummary }) {
  const body = (
    <GlassCard className="flex h-full flex-col gap-3">
      {facility.example ? (
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Пример</p>
      ) : null}
      <p className="text-sm font-medium text-primary">{facility.facilityType}</p>
      <h3>{facility.name}</h3>
      <p className="text-sm text-muted-foreground">{facility.specialties.join(", ")}</p>
      <p className="mt-auto text-sm text-muted-foreground">{facility.cities.join(", ")}</p>
    </GlassCard>
  )

  if (!facility.slug || facility.example) {
    return body
  }

  return (
    <Link
      href={`/${facility.slug}`}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {body}
    </Link>
  )
}
