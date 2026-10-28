export const popularSpecialties = [
  { name: "Кардиология", slug: "kardiologia" },
  { name: "Педиатрия", slug: "pediatria" },
  { name: "Дерматология", slug: "dermatologia" },
  { name: "Неврология", slug: "nevrologia" },
  { name: "Акушерство и гинекология", slug: "ginekologia" },
  { name: "Ортопедия", slug: "ortopedia" },
  { name: "Офталмология", slug: "oftalmologia" },
  { name: "Ендокринология", slug: "endokrinologia" },
] as const

export const popularCities = [
  { name: "София", slug: "sofia" },
  { name: "Пловдив", slug: "plovdiv" },
  { name: "Варна", slug: "varna" },
  { name: "Бургас", slug: "burgas" },
  { name: "Русе", slug: "ruse" },
  { name: "Стара Загора", slug: "stara-zagora" },
] as const

export function labelFromSlug(slug: string) {
  const text = decodeURIComponent(slug).replace(/-/g, " ").trim()
  if (!text) return slug
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function catalogName(
  items: readonly { name: string; slug: string; aliases?: readonly string[] }[],
  slug: string
) {
  const key = slug.trim().toLocaleLowerCase("bg")
  const match = items.find(
    (item) =>
      item.slug.toLocaleLowerCase("bg") === key ||
      item.aliases?.some((alias) => alias.toLocaleLowerCase("bg") === key)
  )
  return match?.name ?? labelFromSlug(slug)
}
