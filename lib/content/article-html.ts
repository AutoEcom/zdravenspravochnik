const allowed = new Set(["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "h2", "h3", "h4", "img", "a"])

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
}

export function looksLikeHtml(content: string) {
  return /<\/?(p|h2|h3|ul|ol|li|img|strong)\b/i.test(content)
}

export function sanitizeArticleHtml(input: string) {
  const stripped = input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")

  return stripped.replace(/<\/?([a-z0-9]+)(\s[^<>]*)?>/gi, (full, rawTag: string, rawAttrs = "") => {
    const name = rawTag.toLowerCase()
    if (!allowed.has(name)) return ""
    if (full.startsWith("</")) return name === "br" || name === "img" ? "" : `</${name}>`
    if (name === "br") return "<br>"
    if (name === "img") {
      const src = String(rawAttrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? "")
      if (!/^https:\/\/\S+$/i.test(src)) return ""
      const alt = String(rawAttrs.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] ?? "")
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">`
    }
    if (name === "a") {
      const href = String(rawAttrs.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? "")
      if (!/^https?:\/\/\S+$/i.test(href)) return ""
      return `<a href="${escapeAttr(href)}" rel="noopener noreferrer">`
    }
    return `<${name}>`
  })
}
