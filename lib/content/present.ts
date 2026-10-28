import type { DoctorSummary } from "@/components/doctors/doctor-card"
import type { FacilitySummary } from "@/components/facilities/facility-card"
import { cleanDisplayName } from "@/lib/content/display-name"
import { catalogName } from "@/lib/content/placeholders"
import type { Doctor, Facility, FacilityType, WorkingHours } from "@/types/database"

export type NamedSlug = { name: string; slug: string }

const facilityTypeLabels: Record<FacilityType, string> = {
  hospital: "Болница",
  clinic: "Медицински център",
  practice: "Практика",
  laboratory: "Лаборатория",
  pharmacy: "Аптека",
  other: "Лечебно заведение",
}

const months = [
  "януари",
  "февруари",
  "март",
  "април",
  "май",
  "юни",
  "юли",
  "август",
  "септември",
  "октомври",
  "ноември",
  "декември",
]

export function formatBgDate(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export function reviewLabel(count: number) {
  if (count === 1) return "1 отзив"
  return `${count} отзива`
}

export function facilityTypeLabel(type: FacilityType, name?: string) {
  if (name?.startsWith("ДКЦ")) return "ДКЦ"
  if (name?.startsWith("МБАЛ")) return "Болница"
  return facilityTypeLabels[type]
}

export function namesFor(slugs: readonly string[], catalog: readonly NamedSlug[]) {
  return slugs.map((slug) => catalogName(catalog, slug))
}

function summaryText(short: string | null | undefined, long: string | null | undefined) {
  const brief = short?.trim()
  if (brief) return brief
  const source = long?.trim()
  if (!source) return null
  const sentence = source.split(/(?<=[.!?])\s+(?=\p{Lu})/u).find((part) => part.length > 40)
  return sentence || source
}

export function presentDoctor(
  doctor: Doctor,
  specialties: readonly NamedSlug[],
  cities: readonly NamedSlug[]
): DoctorSummary {
  return {
    slug: doctor.slug,
    full_name: cleanDisplayName(doctor.full_name),
    title: doctor.title ? cleanDisplayName(doctor.title) : doctor.title,
    specialties: namesFor(doctor.specialties, specialties),
    cities: namesFor(doctor.cities, cities),
    rating: doctor.rating,
    reviewCount: doctor.review_count,
    shortDescription: summaryText(doctor.short_description, doctor.bio),
    acceptsNhif: doctor.accepts_nhif,
    acceptsChildren: doctor.accepts_children,
    onlineConsultation: doctor.online_consultation,
    isPremium: doctor.is_premium,
    isClaimed: doctor.is_claimed,
  }
}

export function presentFacility(
  facility: Facility,
  specialties: readonly NamedSlug[],
  cities: readonly NamedSlug[]
): FacilitySummary {
  return {
    slug: facility.slug,
    name: cleanDisplayName(facility.name),
    facilityType: facilityTypeLabel(facility.facility_type, cleanDisplayName(facility.name)),
    specialties: namesFor(facility.specialties, specialties),
    cities: namesFor(facility.cities, cities),
    rating: facility.rating,
    reviewCount: facility.review_count,
    shortDescription: summaryText(facility.short_description, facility.description),
    acceptsNhif: facility.accepts_nhif,
    acceptsChildren: facility.accepts_children,
    onlineConsultation: facility.online_consultation,
    isClaimed: facility.is_claimed,
  }
}

export function displayName(title: string | null, name: string) {
  return cleanDisplayName([title, name].filter(Boolean).join(" "))
}

const schemaDays: Record<keyof WorkingHours, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

export function openingHoursSpecification(hours: WorkingHours) {
  return (Object.keys(schemaDays) as (keyof WorkingHours)[]).flatMap((key) => {
    const slot = hours[key]
    if (!slot || slot.closed || !slot.open || !slot.close) return []
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: schemaDays[key],
        opens: slot.open,
        closes: slot.close,
      },
    ]
  })
}
