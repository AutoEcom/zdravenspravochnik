function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

export function cardExcerpt(excerpt: string | null | undefined, content?: string | null) {
  const fromExcerpt = stripHtml(excerpt ?? "")
  if (fromExcerpt) return fromExcerpt
  const fromContent = stripHtml(content ?? "")
  return fromContent ? fromContent.slice(0, 320) : null
}
