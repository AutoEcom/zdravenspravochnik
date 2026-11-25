import type { MetadataRoute } from "next"

import { canonicalOrigin, canonicalUrl } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/articles", "/articles/", "/specialisti", "/zavedenia", "/search"],
      disallow: ["/admin", "/dashboard", "/login", "/claim", "/auth"],
    },
    sitemap: canonicalUrl("/sitemap.xml"),
    host: canonicalOrigin(),
  }
}
