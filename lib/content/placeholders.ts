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

export const placeholderDoctors = [
  {
    full_name: "д-р Ива Петрова",
    title: "Кардиолог",
    specialties: ["Кардиология"],
    cities: ["София"],
    rating: 4.9,
  },
  {
    full_name: "д-р Георги Николов",
    title: "Педиатър",
    specialties: ["Педиатрия"],
    cities: ["Пловдив"],
    rating: 4.8,
  },
  {
    full_name: "д-р Елена Димитрова",
    title: "Дерматолог",
    specialties: ["Дерматология"],
    cities: ["Варна"],
    rating: 4.7,
  },
] as const

export const placeholderFacilities = [
  {
    name: "МЦ Вита",
    facilityType: "Клиника",
    specialties: ["Кардиология", "Вътрешни болести"],
    cities: ["София"],
  },
  {
    name: "Детско здраве",
    facilityType: "Практика",
    specialties: ["Педиатрия"],
    cities: ["Пловдив"],
  },
  {
    name: "Очна клиника Лъч",
    facilityType: "Клиника",
    specialties: ["Офталмология"],
    cities: ["Варна"],
  },
] as const

export const placeholderArticles = [
  {
    title: "Кога да запишете час при кардиолог",
    excerpt: "Кои симптоми изискват преглед и как да се подготвите за първото посещение.",
    date: "12 октомври 2026",
  },
  {
    title: "Как да изберете педиатър за детето",
    excerpt: "Практични въпроси за опит, локация и начин на проследяване.",
    date: "3 октомври 2026",
  },
  {
    title: "Какво да очаквате на дерматологичен преглед",
    excerpt: "Кратък ориентир преди посещение в кабинет или клиника.",
    date: "21 септември 2026",
  },
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
