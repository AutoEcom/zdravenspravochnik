import type { Facility } from "@/types/database"

import { JsonLd } from "@/components/seo/json-ld"
import { medicalClinicJsonLd } from "@/components/seo/schemas"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"

const facilityTypeLabels: Record<Facility["facility_type"], string> = {
  hospital: "Болница",
  clinic: "Клиника",
  practice: "Практика",
  laboratory: "Лаборатория",
  pharmacy: "Аптека",
  other: "Лечебно заведение",
}

export function FacilityProfile({ facility }: { facility: Facility }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:py-16">
      <JsonLd data={medicalClinicJsonLd(facility)} />
      <GlassCard variant="strong" className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{facilityTypeLabels[facility.facility_type]}</Badge>
          {facility.is_premium ? <Badge variant="accent">Премиум</Badge> : null}
        </div>
        <h1>{facility.name}</h1>
        <p className="text-muted-foreground">
          {[facility.specialties.join(", "), facility.cities.join(", ")]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {facility.review_count > 0 ? (
          <p className="text-sm font-medium">
            Оценка {facility.rating.toFixed(1)} от {facility.review_count} отзива
          </p>
        ) : null}
        {facility.description ? <p className="leading-relaxed">{facility.description}</p> : null}
      </GlassCard>
      <GlassCard className="grid gap-3 text-sm">
        <h2>Контакт</h2>
        {facility.phone ? (
          <p>
            <a className="text-primary hover:underline" href={`tel:${facility.phone}`}>
              {facility.phone}
            </a>
          </p>
        ) : null}
        {facility.email ? (
          <p>
            <a className="text-primary hover:underline" href={`mailto:${facility.email}`}>
              {facility.email}
            </a>
          </p>
        ) : null}
        {facility.address ? <p>{facility.address}</p> : null}
        {facility.website ? (
          <p>
            <a
              className="text-primary hover:underline"
              href={facility.website}
              rel="noopener noreferrer"
              target="_blank"
            >
              Уебсайт
            </a>
          </p>
        ) : null}
        {!facility.phone && !facility.email && !facility.address && !facility.website ? (
          <p className="text-muted-foreground">Контактът ще бъде добавен скоро.</p>
        ) : null}
      </GlassCard>
    </main>
  )
}
