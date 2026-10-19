import type { Doctor, Facility } from "@/types/database"

import { absoluteUrl, siteConfig } from "@/lib/site"

function defined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null || entry === "") return false
      if (Array.isArray(entry) && entry.length === 0) return false
      return true
    })
  )
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "bg-BG",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function physicianJsonLd(doctor: Doctor) {
  const name = [doctor.title, doctor.full_name].filter(Boolean).join(" ")

  return defined({
    "@context": "https://schema.org",
    "@type": "Physician",
    name,
    url: absoluteUrl(`/${doctor.slug}`),
    description: doctor.bio,
    image: doctor.photo_url,
    telephone: doctor.phone,
    email: doctor.email,
    medicalSpecialty: doctor.specialties,
    address: doctor.address
      ? {
          "@type": "PostalAddress",
          streetAddress: doctor.address,
          addressCountry: "BG",
        }
      : undefined,
    aggregateRating:
      doctor.review_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: doctor.rating,
            reviewCount: doctor.review_count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  })
}

export function medicalClinicJsonLd(facility: Facility) {
  return defined({
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: facility.name,
    url: absoluteUrl(`/${facility.slug}`),
    description: facility.description,
    image: facility.photo_url,
    telephone: facility.phone,
    email: facility.email,
    medicalSpecialty: facility.specialties,
    address: facility.address
      ? {
          "@type": "PostalAddress",
          streetAddress: facility.address,
          addressCountry: "BG",
        }
      : undefined,
    aggregateRating:
      facility.review_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: facility.rating,
            reviewCount: facility.review_count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  })
}
