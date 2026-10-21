const allowed = new Set(["p", "ul", "ol", "li", "h2", "h3", "h4", "br", "strong", "em", "img"])

function sanitizeProfileHtml(value: string) {
  return value.replace(/<[^>]*>/g, (tag) => {
    const name = tag.match(/^<\/?\s*([a-z0-9]+)/i)?.[1]?.toLowerCase()
    if (!name || !allowed.has(name)) return ""
    if (name === "br") return "<br>"
    if (name === "img") {
      const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? ""
      if (!/^https:\/\/(?:www\.)?zdravenspravochnik\.com\/wp-content\//i.test(src)) return ""
      return `<img src="${src.replace(/"/g, "")}" alt="">`
    }
    return tag.startsWith("</") ? `</${name}>` : `<${name}>`
  })
}

export function ProfileDescription({ html }: { html: string }) {
  const safe = sanitizeProfileHtml(html).trim()
  if (!safe) return null
  if (!/<\s*[a-z]/i.test(safe)) {
    return <p className="max-w-3xl leading-relaxed">{safe}</p>
  }

  return (
    <div
      className="max-w-3xl space-y-3 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:font-semibold [&_img]:my-2 [&_img]:max-h-72 [&_img]:w-auto [&_img]:rounded-2xl [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
