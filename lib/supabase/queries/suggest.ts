import { cleanDisplayName } from "@/lib/content/display-name"
import { displayName } from "@/lib/content/present"
import { cleanSearchText } from "@/lib/supabase/queries/search"
import { createClient } from "@/lib/supabase/server"

export type ProfileSuggestion = {
  kind: "doctor" | "facility"
  slug: string
  name: string
  detail: string
}

function quoteLike(value: string) {
  return `"*${value.replace(/"/g, "")}*"`
}

function rank(name: string, query: string) {
  const label = name.toLocaleLowerCase("bg")
  const needle = query.toLocaleLowerCase("bg")
  if (label.startsWith(needle)) return 0
  if (label.includes(needle)) return 1
  return 2
}

export async function suggestProfiles(raw: string): Promise<ProfileSuggestion[]> {
  const query = cleanSearchText(raw).slice(0, 80)
  if (query.length < 3) return []

  const supabase = await createClient()
  const like = quoteLike(query)
  const [doctors, facilities] = await Promise.all([
    supabase
      .from("doctors")
      .select("slug, full_name, title")
      .eq("status", "published")
      .or(`full_name.ilike.${like},title.ilike.${like}`)
      .limit(8),
    supabase
      .from("facilities")
      .select("slug, name")
      .eq("status", "published")
      .ilike("name", `%${query}%`)
      .limit(8),
  ])
  if (doctors.error) throw doctors.error
  if (facilities.error) throw facilities.error

  const suggestions: ProfileSuggestion[] = [
    ...(doctors.data ?? []).map((row) => ({
      kind: "doctor" as const,
      slug: row.slug,
      name: displayName(row.title, row.full_name),
      detail: "Специалист",
    })),
    ...(facilities.data ?? []).map((row) => ({
      kind: "facility" as const,
      slug: row.slug,
      name: cleanDisplayName(row.name),
      detail: "Здравно заведение",
    })),
  ]

  return suggestions
    .sort(
      (left, right) =>
        rank(left.name, query) - rank(right.name, query) || left.name.localeCompare(right.name, "bg"),
    )
    .slice(0, 8)
}
