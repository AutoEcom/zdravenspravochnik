import type { CatalogOption } from "@/lib/content/catalog"

const leadNames = ["софия", "пловдив", "варна"]

export type CityPill = {
  name: string
  slug: string
  count: number
}

export function specialtyCityPills(
  doctorCities: readonly (readonly string[])[],
  catalog: readonly CatalogOption[]
): CityPill[] {
  const counts = new Map<string, CityPill>()

  for (const cities of doctorCities) {
    const seen = new Set<string>()
    for (const raw of cities) {
      const token = raw?.trim()
      if (!token) continue
      const key = token.toLocaleLowerCase("bg")
      const option = catalog.find(
        (item) =>
          item.slug.toLocaleLowerCase("bg") === key ||
          item.aliases.some((alias) => alias.toLocaleLowerCase("bg") === key)
      )
      const slug = option?.slug ?? token
      if (seen.has(slug)) continue
      seen.add(slug)
      const current = counts.get(slug) ?? { name: option?.name ?? token, slug, count: 0 }
      current.count += 1
      counts.set(slug, current)
    }
  }

  return [...counts.values()]
    .filter((city) => city.count >= 1)
    .sort((left, right) => {
      const leftRank = leadNames.indexOf(left.name.toLocaleLowerCase("bg"))
      const rightRank = leadNames.indexOf(right.name.toLocaleLowerCase("bg"))
      const leftLead = leftRank === -1 ? leadNames.length : leftRank
      const rightLead = rightRank === -1 ? leadNames.length : rightRank
      return leftLead - rightLead || left.name.localeCompare(right.name, "bg")
    })
}
