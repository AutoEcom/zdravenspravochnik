import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DoctorProfile } from "@/components/doctors/doctor-profile"
import { FacilityProfile } from "@/components/facilities/facility-profile"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getDoctorBySlug, getFacilityBySlug } from "@/lib/supabase/queries"

const resolvePublicSlug = cache(async (slug: string) => {
  try {
    const doctor = await getDoctorBySlug(slug)
    if (doctor) return { kind: "doctor" as const, doctor }
  } catch {
    // A missing doctor table should still allow a facility lookup.
  }

  try {
    const facility = await getFacilityBySlug(slug)
    if (facility) return { kind: "facility" as const, facility }
  } catch {
    return null
  }

  return null
})

function descriptionFor(match: NonNullable<Awaited<ReturnType<typeof resolvePublicSlug>>>) {
  if (match.kind === "doctor") {
    if (match.doctor.bio) return match.doctor.bio.slice(0, 160)
    return [match.doctor.full_name, match.doctor.specialties[0], match.doctor.cities[0]]
      .filter(Boolean)
      .join(" · ")
  }

  if (match.facility.description) return match.facility.description.slice(0, 160)
  return [match.facility.name, match.facility.cities[0]].filter(Boolean).join(" · ")
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const match = await resolvePublicSlug(slug)

  if (!match) {
    return createPageMetadata({
      title: "Страницата не е намерена",
      description: "Профилът не е публикуван или адресът е променен.",
      path: `/${slug}`,
      index: false,
    })
  }

  const title = match.kind === "doctor" ? match.doctor.full_name : match.facility.name

  return createPageMetadata({
    title,
    description: descriptionFor(match),
    path: `/${slug}`,
  })
}

export default async function PublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const match = await resolvePublicSlug(slug)

  if (!match) notFound()
  if (match.kind === "doctor") return <DoctorProfile doctor={match.doctor} />
  return <FacilityProfile facility={match.facility} />
}
