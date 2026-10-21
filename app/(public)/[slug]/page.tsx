import { cache } from "react"
import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

import { DoctorProfile } from "@/components/doctors/doctor-profile"
import { FacilityProfile } from "@/components/facilities/facility-profile"
import { createPageMetadata } from "@/components/seo/page-meta"
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

const resolvePublicSlug = cache(async (slug: string) => {
  const normalized = normalizePublicSlug(slug)
  try {
    const doctor = await getDoctorBySlug(normalized)
    if (doctor) return { kind: "doctor" as const, doctor }
  } catch {
    // A missing doctor table should still allow the next lookup.
  }

  try {
    const facility = await getFacilityBySlug(normalized)
    if (facility) return { kind: "facility" as const, facility }
  } catch {
    // Continue to articles when the facilities table is unavailable.
  }

  try {
    const article = await getArticleBySlug(normalized)
    if (article) return { kind: "article" as const, article }
  } catch {
    return null
  }

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
    return match.facility.short_description || match.facility.description?.slice(0, 160) || match.facility.name
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
        ? match.facility.name
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

  if (match.kind === "article") permanentRedirect(`/articles/${match.article.slug}`)

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
