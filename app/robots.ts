import type { MetadataRoute } from "next"

import { absoluteUrl, siteConfig } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/articles", "/articles/", "/specialisti", "/zavedenia", "/search"],
      disallow: ["/admin", "/dashboard", "/login", "/claim", "/auth"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  }
}
