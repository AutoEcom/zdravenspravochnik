import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"

type PageMetaInput = {
  title: string
  description: string
  path: string
  absoluteTitle?: boolean
  index?: boolean
  image?: string | null
}

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  index = true,
  image,
}: PageMetaInput): Metadata {
  const canonical = path.startsWith("/") ? path : `/${path}`
  const images = image ? [{ url: image, alt: title }] : undefined

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: "bg_BG",
      type: "website",
      images,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}
