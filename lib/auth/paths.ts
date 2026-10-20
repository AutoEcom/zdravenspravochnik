export function safeNextPath(value: string | null | undefined) {
  if (!value) return null
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null
  if (value.includes("://") || value.includes("\\")) return null
  if (value.startsWith("/login") || value.startsWith("/auth")) return null
  return value
}
