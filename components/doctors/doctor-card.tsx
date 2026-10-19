import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"

export type DoctorSummary = {
  slug?: string
  full_name: string
  title: string | null
  specialties: readonly string[]
  cities: readonly string[]
  rating?: number
  is_premium?: boolean
  example?: boolean
}

export function DoctorCard({ doctor }: { doctor: DoctorSummary }) {
  const body = (
    <GlassCard className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {doctor.example ? <Badge variant="secondary">Пример</Badge> : null}
        {doctor.is_premium ? <Badge variant="accent">Премиум</Badge> : null}
        {doctor.title ? <p className="text-sm font-medium text-primary">{doctor.title}</p> : null}
      </div>
      <h3>{doctor.full_name}</h3>
      <p className="text-sm text-muted-foreground">{doctor.specialties.join(", ") || "Специалност"}</p>
      <p className="mt-auto text-sm text-muted-foreground">{doctor.cities.join(", ") || "България"}</p>
      {doctor.rating && doctor.rating > 0 ? (
        <p className="text-sm font-medium">Оценка {doctor.rating.toFixed(1)}</p>
      ) : null}
    </GlassCard>
  )

  if (!doctor.slug || doctor.example) {
    return body
  }

  return (
    <Link
      href={`/${doctor.slug}`}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {body}
    </Link>
  )
}
