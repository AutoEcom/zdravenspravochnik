const canonicalSiteUrl = "https://zdravenspravochnik.com"

function hostnameOf(value: string) {
  try {
    return new URL(value).hostname
  } catch {
    return ""
  }
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1"
}

function isPreviewHost(hostname: string) {
  return hostname === "vercel.app" || hostname.endsWith(".vercel.app")
}

function isUnsafeOrigin(value: string) {
  const hostname = hostnameOf(value)
  return !hostname || isLocalHost(hostname) || isPreviewHost(hostname)
}

export function canonicalOrigin() {
  return canonicalSiteUrl
}

export function canonicalUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return new URL(normalized, canonicalSiteUrl).toString()
}

function configuredSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  const production = process.env.NODE_ENV === "production"
  if (configured && !isUnsafeOrigin(configured)) {
    const hostname = hostnameOf(configured)
    if (hostname === "zdravenspravochnik.com" || hostname === "www.zdravenspravochnik.com") return canonicalSiteUrl
  }
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
  if (configured && !isUnsafeOrigin(configured)) {
    const hostname = hostnameOf(configured)
    if (hostname === "zdravenspravochnik.com" || hostname === "www.zdravenspravochnik.com") return canonicalSiteUrl
  }
  if (typeof window !== "undefined" && !production && isLocalHost(hostnameOf(window.location.origin))) {
    return window.location.origin.replace(/\/$/, "")
  }
  if (production) return canonicalSiteUrl
  return configured && isLocalHost(hostnameOf(configured)) ? configured : "http://localhost:3000"
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
