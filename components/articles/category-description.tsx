import Link from "next/link"
import type { ReactNode } from "react"

const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g

function specialtyHref(target: string, known: ReadonlySet<string>) {
  if (target === "/specialisti") return "/specialisti"
  const match = target.match(/^\/category\/specialisti\/([^/?#]+)$/)
  if (!match) return "/specialisti"
  let slug = match[1]
  try {
    slug = decodeURIComponent(slug)
  } catch {
    return "/specialisti"
  }
  slug = slug.toLocaleLowerCase("bg")
  return known.has(slug) ? `/category/specialisti/${slug}` : "/specialisti"
}

export function CategoryDescription({
  text,
  specialties,
}: {
  text: string
  specialties: readonly { slug: string; aliases?: readonly string[] }[]
}) {
  const known = new Set(
    specialties.flatMap((item) => [item.slug, ...(item.aliases ?? [])].map((slug) => slug.toLocaleLowerCase("bg"))),
  )
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of text.matchAll(linkPattern)) {
    const index = match.index ?? 0
    if (index > cursor) nodes.push(text.slice(cursor, index))
    const href = specialtyHref(match[2], known)
    nodes.push(
      <Link
        key={`${index}-${href}`}
        href={href}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {match[1]}
      </Link>,
    )
    cursor = index + match[0].length
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))

  return <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{nodes}</p>
}
