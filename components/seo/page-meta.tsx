import type { Metadata } from "next"

import { canonicalUrl, siteConfig } from "@/lib/site"

export const defaultOgImagePath = "/og-default.png"

type PageMetaInput = {
  title: string
  description: string
  path: string
  absoluteTitle?: boolean
  index?: boolean
  image?: string | null
  type?: "website" | "article" | "profile"
}

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  index = true,
  image,
  type = "website",
}: PageMetaInput): Metadata {
  const canonical = canonicalUrl(path)
  const ogImage = image?.trim() || defaultOgImagePath
  const images = [{ url: ogImage, alt: title }]

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
      type,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}
