import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

import { DoctorCard, type DoctorSummary } from "@/components/doctors/doctor-card"
import { OpeningHours } from "@/components/profiles/opening-hours"
import { PlaceCard } from "@/components/profiles/place-card"
import { ProfileActions } from "@/components/profiles/profile-actions"
import { ReviewsNote } from "@/components/profiles/reviews-note"
import { JsonLd } from "@/components/seo/json-ld"
import { physicianJsonLd } from "@/components/seo/schemas"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { displayName, namesFor, reviewLabel, type NamedSlug } from "@/lib/content/present"
import { absoluteUrl } from "@/lib/site"
import type { Doctor } from "@/types/database"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function DoctorProfile({
  doctor,
  specialties,
  cities,
  related,
}: {
  doctor: Doctor
  specialties: readonly NamedSlug[]
  cities: readonly NamedSlug[]
  related: DoctorSummary[]
}) {
  const name = displayName(doctor.title, doctor.full_name)
  const specialtyNames = namesFor(doctor.specialties, specialties)
  const cityNames = namesFor(doctor.cities, cities)
  const locality = doctor.cities[0] ? cities.find((city) => city.slug === doctor.cities[0])?.name : undefined

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 pb-28 sm:py-14 md:pb-16">
      <JsonLd
        data={physicianJsonLd(doctor, {
          specialties: specialtyNames,
          locality,
        })}
      />

      <GlassCard variant="strong" className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {doctor.photo_url ? (
          <Image
            src={doctor.photo_url}
            alt={name}
            width={96}
            height={96}
            unoptimized
            className="size-20 rounded-2xl object-cover sm:size-24"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground sm:size-24">
            {initials(doctor.full_name)}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {doctor.is_premium ? <Badge variant="accent">Премиум</Badge> : null}
            {doctor.accepts_nhif ? <Badge>НЗОК</Badge> : null}
            {doctor.accepts_children ? <Badge variant="success">Деца</Badge> : null}
            {doctor.online_consultation ? <Badge variant="outline">Онлайн</Badge> : null}
          </div>
          <h1>{name}</h1>
          <p className="text-muted-foreground">{cityNames.join(", ") || "България"}</p>
          {doctor.review_count > 0 ? (
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Star className="size-4 fill-warning text-warning" />
              {doctor.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">· {reviewLabel(doctor.review_count)}</span>
            </p>
          ) : null}
          {doctor.short_description ? <p className="max-w-2xl leading-relaxed">{doctor.short_description}</p> : null}
        </div>
      </GlassCard>

      <ProfileActions
        phone={doctor.phone}
        email={doctor.email}
        website={doctor.website}
        shareTitle={name}
        shareUrl={absoluteUrl(`/${doctor.slug}`)}
      />

      {doctor.bio ? (
        <GlassCard className="flex flex-col gap-3">
          <h2>За специалиста</h2>
          <p className="max-w-3xl leading-relaxed">{doctor.bio}</p>
        </GlassCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <OpeningHours hours={doctor.working_hours} />
        {doctor.address ? <PlaceCard address={doctor.address} /> : null}
      </div>

      {doctor.specialties.length > 0 ? (
        <GlassCard>
          <h2>Специалности</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {doctor.specialties.map((slug, index) => (
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

      <GlassCard className="grid gap-2 text-sm">
        <h2>Контакт</h2>
        {doctor.phone ? <p><a className="text-primary hover:underline" href={`tel:${doctor.phone}`}>{doctor.phone}</a></p> : null}
        {doctor.email ? <p><a className="text-primary hover:underline" href={`mailto:${doctor.email}`}>{doctor.email}</a></p> : null}
        {doctor.website ? (
          <p>
            <a className="text-primary hover:underline" href={doctor.website} target="_blank" rel="noopener noreferrer">
              {doctor.website.replace(/^https?:\/\//, "")}
            </a>
          </p>
        ) : null}
        {!doctor.phone && !doctor.email && !doctor.website ? (
          <p className="text-muted-foreground">Контактът ще бъде добавен скоро.</p>
        ) : null}
      </GlassCard>

      <ReviewsNote rating={doctor.rating} count={doctor.review_count} />

      <section className="flex flex-col gap-4" aria-labelledby="related-doctors">
        <h2 id="related-doctors">Други специалисти в {locality ?? "града"}</h2>
        {related.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug ?? item.full_name}>
                <DoctorCard doctor={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Няма други публикувани профили в този град.</p>
        )}
      </section>
    </main>
  )
}
