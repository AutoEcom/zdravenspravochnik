import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

import { FacilityCard, type FacilitySummary } from "@/components/facilities/facility-card"
import { OpeningHours } from "@/components/profiles/opening-hours"
import { PlaceCard } from "@/components/profiles/place-card"
import { ProfileActions } from "@/components/profiles/profile-actions"
import { ReviewsNote } from "@/components/profiles/reviews-note"
import { JsonLd } from "@/components/seo/json-ld"
import { medicalClinicJsonLd } from "@/components/seo/schemas"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { facilityTypeLabel, namesFor, reviewLabel, type NamedSlug } from "@/lib/content/present"
import { absoluteUrl } from "@/lib/site"
import type { Facility } from "@/types/database"

function initials(name: string) {
  return name
    .replace(/[„“"]/g, "")
    .split(" ")
    .filter((part) => part.length > 2)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function FacilityProfile({
  facility,
  specialties,
  cities,
  related,
}: {
  facility: Facility
  specialties: readonly NamedSlug[]
  cities: readonly NamedSlug[]
  related: FacilitySummary[]
}) {
  const specialtyNames = namesFor(facility.specialties, specialties)
  const cityNames = namesFor(facility.cities, cities)
  const locality = facility.cities[0] ? cities.find((city) => city.slug === facility.cities[0])?.name : undefined
  const kind = facilityTypeLabel(facility.facility_type, facility.name)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 pb-28 sm:py-14 md:pb-16">
      <JsonLd
        data={medicalClinicJsonLd(facility, {
          specialties: specialtyNames,
          locality,
        })}
      />

      <GlassCard variant="strong" className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {facility.photo_url ? (
          <Image
            src={facility.photo_url}
            alt={facility.name}
            width={96}
            height={96}
            unoptimized
            className="size-20 rounded-2xl object-cover sm:size-24"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground sm:size-24">
            {initials(facility.name) || "ЗС"}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{kind}</Badge>
            {facility.is_premium ? <Badge variant="accent">Премиум</Badge> : null}
            {facility.accepts_nhif ? <Badge>НЗОК</Badge> : null}
            {facility.accepts_children ? <Badge variant="success">Деца</Badge> : null}
            {facility.online_consultation ? <Badge variant="outline">Онлайн</Badge> : null}
          </div>
          <h1>{facility.name}</h1>
          <p className="text-muted-foreground">{cityNames.join(", ") || "България"}</p>
          {facility.review_count > 0 ? (
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Star className="size-4 fill-warning text-warning" />
              {facility.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">· {reviewLabel(facility.review_count)}</span>
            </p>
          ) : null}
          {facility.short_description ? (
            <p className="max-w-2xl leading-relaxed">{facility.short_description}</p>
          ) : null}
        </div>
      </GlassCard>

      <ProfileActions
        phone={facility.phone}
        email={facility.email}
        website={facility.website}
        shareTitle={facility.name}
        shareUrl={absoluteUrl(`/${facility.slug}`)}
      />

      {facility.description ? (
        <GlassCard className="flex flex-col gap-3">
          <h2>За заведението</h2>
          <p className="max-w-3xl leading-relaxed">{facility.description}</p>
        </GlassCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <OpeningHours hours={facility.working_hours} />
        {facility.address ? <PlaceCard address={facility.address} /> : null}
      </div>

      {facility.specialties.length > 0 ? (
        <GlassCard>
          <h2>Специалности</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {facility.specialties.map((slug, index) => (
              <li key={slug}>
                <Link
                  href={`/category/specialisti/${slug}`}
                  className="inline-flex h-10 items-center rounded-full border border-primary/15 bg-white/70 px-4 text-sm transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {specialtyNames[index] ?? slug}
                </Link>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}

      <ReviewsNote rating={facility.rating} count={facility.review_count} />

      <section className="flex flex-col gap-4" aria-labelledby="related-facilities">
        <h2 id="related-facilities">Други заведения в {locality ?? "града"}</h2>
        {related.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug ?? item.name}>
                <FacilityCard facility={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Няма други публикувани заведения в този град.</p>
        )}
      </section>
    </main>
  )
}
