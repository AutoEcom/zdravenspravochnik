import { popularCities, popularSpecialties } from "@/lib/content/placeholders"
import { getCities, getSpecialties } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

export async function getSearchOptions() {
  const [specialties, cities] = await Promise.all([
    safeQuery(getSpecialties, []),
    safeQuery(getCities, []),
  ])

  return {
    specialties: specialties.length > 0 ? specialties : [...popularSpecialties],
    cities: cities.length > 0 ? cities : [...popularCities],
  }
}
