import type { Article, Doctor, Facility } from "@/types/database"

import { openingHoursSpecification } from "@/lib/content/present"
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

function services(names: string[]) {
  return names.map((name) => ({
    "@type": "MedicalProcedure",
    name: `Консултация по ${name.toLowerCase()}`,
  }))
}

function mapLink(address: string | null) {
  if (!address) return undefined
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function areaServed(locality?: string) {
  return locality
    ? { "@type": "City", name: locality }
    : { "@type": "Country", name: "България" }
}

function contactPoint(phone: string | null) {
  if (!phone) return undefined
  return {
    "@type": "ContactPoint",
    telephone: phone,
    contactType: "reservations",
    availableLanguage: ["bg"],
    areaServed: "BG",
  }
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

export function physicianJsonLd(
  doctor: Doctor,
  labels?: { specialties?: string[]; locality?: string }
) {
  const name = [doctor.title, doctor.full_name].filter(Boolean).join(" ")
  const specialties = labels?.specialties?.length ? labels.specialties : doctor.specialties
  const pageUrl = absoluteUrl(`/${doctor.slug}`)

  return defined({
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": `${pageUrl}#physician`,
    name,
    honorificPrefix: doctor.title,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    description: doctor.short_description || doctor.bio,
    image: doctor.photo_url,
    telephone: doctor.phone,
    email: doctor.email,
    knowsLanguage: "bg",
    medicalSpecialty: specialties,
    availableService: services(specialties),
    paymentAccepted: doctor.accepts_nhif ? "НЗОК" : undefined,
    areaServed: areaServed(labels?.locality),
    contactPoint: contactPoint(doctor.phone),
    hasMap: mapLink(doctor.address),
    address: doctor.address
      ? {
          "@type": "PostalAddress",
          streetAddress: doctor.address,
          addressLocality: labels?.locality,
          addressCountry: "BG",
        }
      : undefined,
    openingHoursSpecification: openingHoursSpecification(doctor.working_hours),
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

export function medicalClinicJsonLd(
  facility: Facility,
  labels?: { specialties?: string[]; locality?: string }
) {
  const specialties = labels?.specialties?.length ? labels.specialties : facility.specialties
  const pageUrl = absoluteUrl(`/${facility.slug}`)

  return defined({
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${pageUrl}#clinic`,
    name: facility.name,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    description: facility.short_description || facility.description,
    image: facility.photo_url,
    telephone: facility.phone,
    email: facility.email,
    availableLanguage: ["bg"],
    medicalSpecialty: specialties,
    availableService: services(specialties),
    paymentAccepted: facility.accepts_nhif ? "НЗОК" : undefined,
    areaServed: areaServed(labels?.locality),
    contactPoint: contactPoint(facility.phone),
    hasMap: mapLink(facility.address),
    address: facility.address
      ? {
          "@type": "PostalAddress",
          streetAddress: facility.address,
          addressLocality: labels?.locality,
          addressCountry: "BG",
        }
      : undefined,
    openingHoursSpecification: openingHoursSpecification(facility.working_hours),
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

export function articleJsonLd(article: Article, cover: string | null) {
  const pageUrl = absoluteUrl(`/articles/${article.slug}`)
  const body = article.content.replace(/[#*[\]()]/g, " ").replace(/\s+/g, " ").trim()

  return defined({
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline: article.title,
    description: article.excerpt || body.slice(0, 160),
    articleBody: body,
    image: cover ? [cover] : undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    inLanguage: "bg-BG",
    isAccessibleForFree: true,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  })
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}
