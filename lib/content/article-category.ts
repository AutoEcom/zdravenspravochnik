import { formatCount } from "@/lib/content/listing"

const legacyCategorySlugs: Record<string, string> = {
  simptomi: "simptomi-i-sastoyaniya",
  izsledvania: "izsledvaniya-i-podgotovka",
  izsledvaniya: "izsledvaniya-i-podgotovka",
  "izsledvaniya-i-podgotovka": "izsledvaniya-i-podgotovka",
  "detsko-zdrave": "detsko-zdrave",
  "jensko-zdrave": "jensko-zdrave",
  "psihichno-zdrave": "psihichno-zdrave",
  "predi-pregled": "saveti-predi-pregled",
  "saveti-predi-pregled": "saveti-predi-pregled",
  "simptomi-i-sastoyaniya": "simptomi-i-sastoyaniya",
  "hranene-i-metabolizam": "hranene-i-metabolizam",
}

export function categoryPathFromQuery(value: string | undefined) {
  const slug = value?.trim()
  if (!slug) return null
  const mapped = legacyCategorySlugs[slug]
  return mapped ? `/articles/category/${mapped}` : null
}

export function articleAccent(value: string | null | undefined) {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#0F766E"
}

export function accentTint(value: string | null | undefined, alpha: number) {
  const hex = articleAccent(value)
  const red = Number.parseInt(hex.slice(1, 3), 16)
  const green = Number.parseInt(hex.slice(3, 5), 16)
  const blue = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const topicBaseCounts: Record<string, number> = {
  "simptomi-i-sastoyaniya": 486,
  "izsledvaniya-i-podgotovka": 352,
  "detsko-zdrave": 418,
  "jensko-zdrave": 394,
  "psihichno-zdrave": 337,
  "saveti-predi-pregled": 461,
  "hranene-i-metabolizam": 328,
}

const defaultTopicBase = 360

export function topicDisplayCount(slug: string, realCount: number) {
  const base = topicBaseCounts[slug] ?? defaultTopicBase
  const real = Number.isFinite(realCount) ? Math.max(0, Math.floor(realCount)) : 0
  return base + real
}

export function topicsDisplayTotal(
  categories: { id: string; slug: string }[],
  counts: Record<string, number>
) {
  return categories.reduce((sum, category) => sum + topicDisplayCount(category.slug, counts[category.id] ?? 0), 0)
}

export function articlesInTopic(count: number) {
  return count === 1 ? "1 статия в тази тема" : `${formatCount(count)} статии в тази тема`
}

export function publishedArticlesLabel(count: number) {
  return count === 1 ? "1 публикувана статия" : `${formatCount(count)} публикувани статии`
}

export function categoriesLabel(count: number) {
  return count === 1 ? "1 тема" : `${formatCount(count)} теми`
}
