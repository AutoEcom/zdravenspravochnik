const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const siteConfig = {
  name: "Здравен справочник",
  description:
    "Намерете лекар, специалист или лечебно заведение в България. Профили, специалности и контакти на едно място.",
  url: rawSiteUrl.replace(/\/$/, ""),
}

export function absoluteUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${siteConfig.url}${normalized}`
}
