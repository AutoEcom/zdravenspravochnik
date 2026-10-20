import Link from "next/link"
import { Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { reviewLabel } from "@/lib/content/present"

export type FacilitySummary = {
  name: string
  facilityType: string
  specialties: readonly string[]
  cities: readonly string[]
  slug?: string
  rating?: number
  reviewCount?: number
  shortDescription?: string | null
  acceptsNhif?: boolean
  acceptsChildren?: boolean
  onlineConsultation?: boolean
  example?: boolean
}

export function FacilityCard({ facility }: { facility: FacilitySummary }) {
  const body = (
    <GlassCard variant="panel" className="flex h-full flex-col gap-3 transition-shadow duration-200 group-hover:shadow-md">
      <div className="flex flex-wrap gap-2">
        {facility.example ? <Badge variant="secondary">Пример</Badge> : null}
        {facility.acceptsNhif ? <Badge>НЗОК</Badge> : null}
        {facility.acceptsChildren ? <Badge variant="success">Деца</Badge> : null}
        {facility.onlineConsultation ? <Badge variant="outline">Онлайн</Badge> : null}
      </div>
      <p className="text-sm font-medium text-primary">{facility.facilityType}</p>
      <h3>{facility.name}</h3>
      <p className="text-sm text-muted-foreground">{facility.specialties.join(", ") || "Специалности"}</p>
      <p className="text-sm text-muted-foreground">{facility.cities.join(", ") || "България"}</p>
      {facility.shortDescription ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{facility.shortDescription}</p>
      ) : null}
      {facility.rating && facility.rating > 0 ? (
        <p className="mt-auto flex items-center gap-1.5 text-sm font-medium">
          <Star className="size-4 fill-warning text-warning" />
          {facility.rating.toFixed(1)}
          {facility.reviewCount ? (
            <span className="font-normal text-muted-foreground">· {reviewLabel(facility.reviewCount)}</span>
          ) : null}
        </p>
      ) : null}
    </GlassCard>
  )

  if (!facility.slug || facility.example) return body

  return (
    <Link
      href={`/${facility.slug}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {body}
    </Link>
  )
}
