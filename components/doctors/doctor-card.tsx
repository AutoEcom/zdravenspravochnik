import Link from "next/link"
import { Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { reviewLabel } from "@/lib/content/present"

export type DoctorSummary = {
  slug?: string
  full_name: string
  title: string | null
  specialties: readonly string[]
  cities: readonly string[]
  rating?: number
  reviewCount?: number
  shortDescription?: string | null
  acceptsNhif?: boolean
  acceptsChildren?: boolean
  onlineConsultation?: boolean
  isPremium?: boolean
  example?: boolean
}

export function DoctorCard({ doctor }: { doctor: DoctorSummary }) {
  const body = (
    <GlassCard className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {doctor.example ? <Badge variant="secondary">Пример</Badge> : null}
        {doctor.isPremium ? <Badge variant="accent">Премиум</Badge> : null}
        {doctor.acceptsNhif ? <Badge>НЗОК</Badge> : null}
        {doctor.acceptsChildren ? <Badge variant="success">Деца</Badge> : null}
        {doctor.onlineConsultation ? <Badge variant="outline">Онлайн</Badge> : null}
      </div>
      {doctor.title ? <p className="text-sm font-medium text-primary">{doctor.title}</p> : null}
      <h3>{doctor.full_name}</h3>
      <p className="text-sm text-muted-foreground">{doctor.specialties.join(", ") || "Специалност"}</p>
      <p className="text-sm text-muted-foreground">{doctor.cities.join(", ") || "България"}</p>
      {doctor.shortDescription ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{doctor.shortDescription}</p>
      ) : null}
      {doctor.rating && doctor.rating > 0 ? (
        <p className="mt-auto flex items-center gap-1.5 text-sm font-medium">
          <Star className="size-4 fill-warning text-warning" />
          {doctor.rating.toFixed(1)}
          {doctor.reviewCount ? (
            <span className="font-normal text-muted-foreground">· {reviewLabel(doctor.reviewCount)}</span>
          ) : null}
        </p>
      ) : null}
    </GlassCard>
  )

  if (!doctor.slug || doctor.example) return body

  return (
    <Link
      href={`/${doctor.slug}`}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {body}
    </Link>
  )
}
