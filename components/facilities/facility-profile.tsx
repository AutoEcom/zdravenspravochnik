import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

import { FacilityCard, type FacilitySummary } from "@/components/facilities/facility-card"
import { OpeningHours } from "@/components/profiles/opening-hours"
import { PlaceCard } from "@/components/profiles/place-card"
import { ProfileActions } from "@/components/profiles/profile-actions"
import { ProfileDescription } from "@/components/profiles/rich-text"
import { ProfileFaq } from "@/components/profiles/profile-faq"
import { ReviewsNote } from "@/components/profiles/reviews-note"
import { JsonLd } from "@/components/seo/json-ld"
import { breadcrumbJsonLd, faqPageJsonLd, medicalClinicJsonLd } from "@/components/seo/schemas"
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
  const faqs = facilityFaqs(facility, specialtyNames, locality, kind)
  const crumbs = [
    { name: "Начало", path: "/" },
    { name: "Заведения", path: "/zavedenia" },
    { name: facility.name, path: `/${facility.slug}` },
  ]

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 pb-36 sm:py-14 md:pb-16">
      <JsonLd
        data={[
          medicalClinicJsonLd(facility, { specialties: specialtyNames, locality }),
          breadcrumbJsonLd(crumbs),
          faqPageJsonLd(faqs),
        ]}
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
          <ProfileDescription html={facility.description} />
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

      {related.length > 0 ? (
        <section className="flex flex-col gap-4" aria-labelledby="related-facilities">
          <h2 id="related-facilities">Други заведения в {locality ?? "града"}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug ?? item.name}>
                <FacilityCard facility={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ProfileFaq items={faqs} />
    </main>
  )
}

function facilityFaqs(
  facility: Facility,
  specialtyNames: string[],
  locality: string | undefined,
  kind: string
) {
  const place = locality ?? "България"
  const specs = specialtyNames.filter(Boolean).join(", ")
  const contact = [
    facility.phone ? `обадете се на ${facility.phone}` : null,
    facility.email ? `пишете на ${facility.email}` : null,
  ].filter(Boolean)

  return [
    {
      question: `Как да запиша час в ${facility.name}?`,
      answer: contact.length
        ? `За час ${contact.join(" или ")}. Регистратурата потвърждава часа и нужните документи.`
        : "Контактът на регистратурата е посочен в профила, когато е публикуван.",
    },
    {
      question: "Приемат ли се направления по НЗОК?",
      answer: facility.accepts_nhif
        ? "Да. Заведението приема направления по НЗОК. Носете направлението и документ за самоличност."
        : "В профила няма отметка за прием по НЗОК. Уточнете плащането при записване.",
    },
    {
      question: "Подходящо ли е за деца?",
      answer: facility.accepts_children
        ? "Да. Профилът е отбелязан, че приема деца."
        : "Профилът не е отбелязан за деца. Попитайте регистратурата преди записване.",
    },
    {
      question: `Какви специалисти има в ${kind.toLowerCase()}?`,
      answer: specs
        ? `Публикуваните направления са: ${specs}.`
        : "Списъкът със специалности се допълва с публикуването на кабинетите.",
    },
    {
      question: `Къде се намира в ${place}?`,
      answer: facility.address
        ? `Адресът е ${facility.address}.`
        : `Заведението е в ${place}. Точният адрес се потвърждава при записване.`,
    },
  ]
}
