import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"

type PageMetaInput = {
  title: string
  description: string
  path: string
  absoluteTitle?: boolean
  index?: boolean
}

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  index = true,
}: PageMetaInput): Metadata {
  const canonical = path.startsWith("/") ? path : `/${path}`

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
    },
  }
}
