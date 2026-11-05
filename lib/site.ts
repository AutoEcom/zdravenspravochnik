const canonicalSiteUrl = "https://zdravenspravochnik.com"

function isLocalUrl(value: string) {
  try {
    const host = new URL(value).hostname
    return host === "localhost" || host === "127.0.0.1"
  } catch {
    return true
  }
}

function configuredSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  const production = process.env.NODE_ENV === "production"
  if (configured && !(production && isLocalUrl(configured))) return configured
  if (production) return canonicalSiteUrl
  return configured || "http://localhost:3000"
}

export const siteConfig = {
  name: "Здравен справочник",
  description:
    "Намерете лекар, специалист или лечебно заведение в България. Профили, специалности и контакти на едно място.",
  url: configuredSiteUrl(),
}

export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  const production = process.env.NODE_ENV === "production"
  if (configured && !(production && isLocalUrl(configured))) return configured
  if (typeof window !== "undefined" && !(production && isLocalUrl(window.location.origin))) {
    return window.location.origin.replace(/\/$/, "")
  }
  return production ? canonicalSiteUrl : configured || "http://localhost:3000"
}

export function absoluteUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${siteOrigin()}${normalized}`
}

export function shareUrl(url: string) {
  try {
    const origin = siteOrigin()
    const parsed = new URL(url, origin)
    const base = new URL(origin)
    parsed.protocol = base.protocol
    parsed.hostname = base.hostname
    parsed.port = base.port
    return parsed.toString()
  } catch {
    return url
  }
}
