const cyrillic: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sht",
  ъ: "a",
  ь: "y",
  ю: "yu",
  я: "ya",
}

function toLatin(value: string, softSign: string) {
  return value
    .trim()
    .toLocaleLowerCase("bg")
    .split("")
    .map((char) => (char === "ь" ? softSign : cyrillic[char] ?? char))
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function slugifyTitle(value: string, max = 80) {
  return toLatin(value, "y").slice(0, max)
}

export function latinSlug(value: string, max = 80) {
  return toLatin(value, "").slice(0, max)
}

export function articleCover(article: { cover_image_url?: string | null; cover_url?: string | null }) {
  return article.cover_image_url || article.cover_url || null
}

export function articleOgImage(article: {
  og_image_url?: string | null
  cover_image_url?: string | null
  cover_url?: string | null
}) {
  return article.og_image_url || articleCover(article)
}
