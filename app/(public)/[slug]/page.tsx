import { cache } from "react"
import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

import { DoctorProfile } from "@/components/doctors/doctor-profile"
import { FacilityProfile } from "@/components/facilities/facility-profile"
import { createPageMetadata } from "@/components/seo/page-meta"
import { cleanDisplayName } from "@/lib/content/display-name"
import { articleCover } from "@/lib/content/slug"
import { getSearchOptions } from "@/lib/content/catalog"
import { displayName, presentDoctor, presentFacility } from "@/lib/content/present"
import {
  getArticleBySlug,
  getDoctorBySlug,
  getDoctorsInCity,
  getFacilitiesInCity,
  getFacilityBySlug,
} from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

function normalizePublicSlug(slug: string) {
  try {
    return decodeURIComponent(slug).normalize("NFC")
  } catch {
    return slug.normalize("NFC")
  }
}

function profileBlocksArticle(label: string, slug: string, phone: string | null, nhif: boolean | null, claimed: boolean) {
  if (claimed || phone || nhif) return true
  if (/болниц|мбал|умбал|дкц|център|лаборатор|клиник|хоспис|диспансер|аптек|санаториум|\bсбр\b|поликлиник|еоод/i.test(label)) {
    return true
  }
  const personName = /^(?:(?:проф|доц)\.\s*)?(?:д-р|доктор)\b/i.test(label.trim())
  const personSlug = /^(?:д-р|доктор|проф|доц|d-r)[-]/i.test(slug)
  return personName && personSlug
}

const resolvePublicSlug = cache(async (slug: string) => {
  const normalized = normalizePublicSlug(slug)
  let doctor: Awaited<ReturnType<typeof getDoctorBySlug>> = null
  let facility: Awaited<ReturnType<typeof getFacilityBySlug>> = null
  let article: Awaited<ReturnType<typeof getArticleBySlug>> = null

  try {
    doctor = await getDoctorBySlug(normalized)
  } catch {
    doctor = null
  }

  try {
    facility = await getFacilityBySlug(normalized)
  } catch {
    facility = null
  }

  try {
    article = await getArticleBySlug(normalized)
  } catch {
    article = null
  }

  const blocked =
    (doctor &&
      profileBlocksArticle(
        displayName(doctor.title, doctor.full_name),
        doctor.slug,
        doctor.phone,
        doctor.accepts_nhif,
        doctor.is_claimed
      )) ||
    (facility &&
      profileBlocksArticle(
        cleanDisplayName(facility.name),
        facility.slug,
        facility.phone,
        facility.accepts_nhif,
        facility.is_claimed
      ))

  if (article && !blocked) return { kind: "article" as const, article }
  if (doctor) return { kind: "doctor" as const, doctor }
  if (facility) return { kind: "facility" as const, facility }
  if (article) return { kind: "article" as const, article }
  return null
})

function descriptionFor(match: NonNullable<Awaited<ReturnType<typeof resolvePublicSlug>>>) {
  if (match.kind === "doctor") {
    return (
      match.doctor.short_description ||
      match.doctor.bio?.slice(0, 160) ||
      displayName(match.doctor.title, match.doctor.full_name)
    )
  }

  if (match.kind === "facility") {
    return (
      match.facility.short_description ||
      match.facility.description?.slice(0, 160) ||
      cleanDisplayName(match.facility.name)
    )
  }

  return match.article.excerpt || match.article.content.slice(0, 160)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const slug = normalizePublicSlug((await params).slug)
  const match = await resolvePublicSlug(slug)

  if (!match) {
    return createPageMetadata({
      title: "Страницата не е намерена",
      description: "Профилът не е публикуван или адресът е променен.",
      path: `/${slug}`,
      index: false,
    })
  }

  const title =
    match.kind === "doctor"
      ? displayName(match.doctor.title, match.doctor.full_name)
      : match.kind === "facility"
        ? cleanDisplayName(match.facility.name)
        : match.article.title

  const image =
    match.kind === "doctor"
      ? match.doctor.photo_url
      : match.kind === "facility"
        ? match.facility.photo_url
        : articleCover(match.article)

  return createPageMetadata({
    title,
    description: descriptionFor(match),
    path: match.kind === "article" ? `/articles/${match.article.slug}` : `/${slug}`,
    image,
  })
}

export default async function PublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = normalizePublicSlug((await params).slug)
  const match = await resolvePublicSlug(slug)
  if (!match) notFound()

  if (match.kind === "article") permanentRedirect(`/articles/${encodeURIComponent(match.article.slug)}`)

  const { specialties, cities } = await getSearchOptions()

  if (match.kind === "doctor") {
    const city = match.doctor.cities[0]
    const related = city
      ? await safeQuery(() => getDoctorsInCity(city, match.doctor.id), [])
      : []

    return (
      <DoctorProfile
        doctor={match.doctor}
        specialties={specialties}
        cities={cities}
        related={related.map((doctor) => presentDoctor(doctor, specialties, cities))}
      />
    )
  }

  const city = match.facility.cities[0]
  const related = city
    ? await safeQuery(() => getFacilitiesInCity(city, match.facility.id), [])
    : []

  return (
    <FacilityProfile
      facility={match.facility}
      specialties={specialties}
      cities={cities}
      related={related.map((facility) => presentFacility(facility, specialties, cities))}
    />
  )
}
