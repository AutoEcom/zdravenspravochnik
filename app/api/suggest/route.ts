import { suggestProfiles } from "@/lib/supabase/queries/suggest"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? ""
  try {
    const suggestions = await suggestProfiles(query)
    return Response.json({ suggestions })
  } catch (error) {
    console.error(error)
    return Response.json({ suggestions: [] })
  }
}
