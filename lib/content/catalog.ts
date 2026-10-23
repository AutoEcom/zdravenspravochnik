import { humanLabel, specialtyDisplay } from "@/lib/content/normalize"
import { popularCities, popularSpecialties, labelFromSlug } from "@/lib/content/placeholders"
import { getCities, getSpecialties } from "@/lib/supabase/queries"
import { getPublishedTerms } from "@/lib/supabase/queries/search"
import { safeQuery } from "@/lib/supabase/safe"

export type CatalogOption = {
  name: string
  slug: string
  description?: string | null
  aliases: string[]
}

function chooseName(names: string[]) {
  return [...names].sort((left, right) => {
    const leftCyrillic = /\p{Script=Cyrillic}/u.test(left) ? 0 : 1
    const rightCyrillic = /\p{Script=Cyrillic}/u.test(right) ? 0 : 1
    const leftCapital = left[0] === left[0]?.toLocaleUpperCase("bg") ? 0 : 1
    const rightCapital = right[0] === right[0]?.toLocaleUpperCase("bg") ? 0 : 1
    return leftCyrillic - rightCyrillic || leftCapital - rightCapital || left.localeCompare(right, "bg")
  })[0]
}

function canonicalSlug(slugs: string[]) {
  return [...slugs].sort((left, right) => left.length - right.length || left.localeCompare(right, "bg"))[0]
}

function catalogLabel(value: string, mode: "city" | "specialty") {
  return mode === "specialty" ? specialtyDisplay(value) : humanLabel(value)
}

export function uniqueCatalogOptions(
  catalog: readonly { name: string; slug: string; description?: string | null }[],
  usedSlugs: readonly string[],
  mode: "city" | "specialty" = "specialty",
): CatalogOption[] {
  const bySlug = new Map<string, { names: string[]; description?: string | null }>()
  for (const row of catalog) {
    const slug = row.slug?.trim()
    if (!slug) continue
    const current = bySlug.get(slug) ?? { names: [] }
    if (row.name?.trim()) current.names.push(row.name.trim())
    if (row.description && !current.description) current.description = row.description
    bySlug.set(slug, current)
  }
  for (const slug of usedSlugs) {
    const trimmed = slug?.trim()
    if (!trimmed || bySlug.has(trimmed)) continue
    bySlug.set(trimmed, { names: [labelFromSlug(trimmed)] })
  }

  const groups = new Map<string, { names: string[]; slugs: string[]; description?: string | null }>()
  for (const [slug, info] of bySlug) {
    const name = catalogLabel(chooseName(info.names.length > 0 ? info.names : [labelFromSlug(slug)]), mode)
    if (!name) continue
    const key = name.toLocaleLowerCase("bg").replace(/\s+/g, " ").trim()
    const group = groups.get(key) ?? { names: [], slugs: [] }
    group.names.push(name)
    group.slugs.push(slug)
    if (info.description && !group.description) group.description = info.description
    groups.set(key, group)
  }

  return [...groups.values()]
    .map((group) => ({
      name: chooseName(group.names),
      slug: canonicalSlug(group.slugs).toLocaleLowerCase("bg"),
      description: group.description ?? null,
      aliases: [...new Set(group.slugs.map((slug) => slug.trim()).filter(Boolean))],
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "bg"))
}

export function optionAliases(options: readonly CatalogOption[], value: string) {
  const key = value.trim().toLocaleLowerCase("bg")
  if (!key) return []
  const option = options.find(
    (item) =>
      item.slug.toLocaleLowerCase("bg") === key ||
      item.name.toLocaleLowerCase("bg") === key ||
      item.aliases.some((alias) => alias.toLocaleLowerCase("bg") === key)
  )
  const seeds = option ? [option.slug, ...option.aliases] : [value.trim()]
  const aliases = new Set<string>()
  for (const seed of seeds) {
    const trimmed = seed.trim()
    if (!trimmed) continue
    aliases.add(trimmed)
    aliases.add(trimmed.toLocaleLowerCase("bg"))
  }
  return [...aliases]
}

function withAliases(items: readonly { name: string; slug: string; description?: string }[]) {
  return items.map((item) => ({ ...item, description: item.description ?? null, aliases: [item.slug] }))
}

export async function getSearchOptions() {
  const [specialtyRows, cityRows, used] = await Promise.all([
    safeQuery(getSpecialties, []),
    safeQuery(getCities, []),
    safeQuery(getPublishedTerms, { specialties: [], cities: [] }),
  ])

  const specialties = uniqueCatalogOptions(specialtyRows, used.specialties, "specialty")
  const cities = uniqueCatalogOptions(cityRows, used.cities, "city")

  return {
    specialties: specialties.length > 0 ? specialties : withAliases(popularSpecialties),
    cities: cities.length > 0 ? cities : withAliases(popularCities),
  }
}
