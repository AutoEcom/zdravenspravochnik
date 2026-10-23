import { normalizeIdentity } from "@/lib/content/normalize"

type DedupeFields = {
  slug: string
  phone: string | null
  is_claimed: boolean
  is_featured: boolean
  source: string | null
}

function rank(row: DedupeFields) {
  return (row.is_claimed ? 100 : 0) + (row.source === "legacy_wp" ? 40 : 0) + (row.is_featured ? 10 : 0) + (row.phone ? 1 : 0)
}

export function dedupeProfiles<T>(
  rows: readonly T[],
  read: (row: T) => DedupeFields & { name: string; city: string },
): T[] {
  const kept: T[] = []
  const indexByKey = new Map<string, number>()

  for (const row of rows) {
    const fields = read(row)
    const identity = `${normalizeIdentity(fields.name)}|${normalizeIdentity(fields.city)}`
    const keys = [identity, `slug:${fields.slug.toLocaleLowerCase("bg")}`]
    const existing = keys.map((key) => indexByKey.get(key)).find((index) => index !== undefined)

    if (existing === undefined) {
      const index = kept.length
      kept.push(row)
      for (const key of keys) indexByKey.set(key, index)
      continue
    }

    if (rank(fields) > rank(read(kept[existing]))) {
      kept[existing] = row
      for (const key of keys) indexByKey.set(key, existing)
    }
  }

  return kept
}
