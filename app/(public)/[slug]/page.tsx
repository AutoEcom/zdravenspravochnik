import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ArticleDocument, articlePageMetadata } from "@/components/articles/article-document"
import { DoctorProfile } from "@/components/doctors/doctor-profile"
import { FacilityProfile } from "@/components/facilities/facility-profile"
import { createPageMetadata } from "@/components/seo/page-meta"
import { cleanDisplayName } from "@/lib/content/display-name"
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
  let doctor: Awaited<ReturnType<typeof getDoctorBySlug>> = null
  let facility: Awaited<ReturnType<typeof getFacilityBySlug>> = null
  let article: Awaited<ReturnType<typeof getArticleBySlug>> = null

  try {
    doctor = await getDoctorBySlug(normalized)
  } catch {
    doctor = null
  }
  if (doctor) return { kind: "doctor" as const, doctor }

  try {
    facility = await getFacilityBySlug(normalized)
  } catch {
    facility = null
  }
  if (facility) return { kind: "facility" as const, facility }

  try {
    article = await getArticleBySlug(normalized)
  } catch {
    article = null
  }
  if (article) return { kind: "article" as const, article }
  return null
})

function descriptionFor(match: Exclude<NonNullable<Awaited<ReturnType<typeof resolvePublicSlug>>>, { kind: "article" }>) {
  if (match.kind === "doctor") {
    return (
      match.doctor.short_description ||
      match.doctor.bio?.slice(0, 160) ||
      displayName(match.doctor.title, match.doctor.full_name)
    )
  }

  return (
    match.facility.short_description ||
    match.facility.description?.slice(0, 160) ||
    cleanDisplayName(match.facility.name)
  )
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

  if (match.kind === "article") return articlePageMetadata(match.article)

  const title =
    match.kind === "doctor"
      ? displayName(match.doctor.title, match.doctor.full_name)
      : cleanDisplayName(match.facility.name)

  const image = match.kind === "doctor" ? match.doctor.photo_url : match.facility.photo_url

  return createPageMetadata({
    title,
    description: descriptionFor(match),
    path: `/${slug}`,
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
  if (match.kind === "article") return <ArticleDocument article={match.article} />

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
