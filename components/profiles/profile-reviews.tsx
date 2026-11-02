import Link from "next/link"

import { ReviewForm } from "@/components/profiles/review-form"
import { GlassCard } from "@/components/ui/glass-card"
import { formatBgDate } from "@/lib/content/present"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

const disclaimer =
  "Отзивите са от потребители с Google акаунт. Здравен справочник не гарантира медицинска точност на мненията и не препоръчва конкретен специалист."

function usesGoogle(user: User) {
  return user.app_metadata?.provider === "google" || (user.identities ?? []).some((identity) => identity.provider === "google")
}

export async function ProfileReviews({
  doctorId,
  facilityId,
  slug,
}: {
  doctorId?: string
  facilityId?: string
  slug: string
}) {
  const supabase = await createClient()
  const target = doctorId ? supabase.from("reviews").select("id, rating, comment, created_at").eq("doctor_id", doctorId) : facilityId ? supabase.from("reviews").select("id, rating, comment, created_at").eq("facility_id", facilityId) : null
  const [{ data: userData }, listed] = await Promise.all([
    supabase.auth.getUser(),
    target ? target.eq("status", "published").order("created_at", { ascending: false }).limit(12) : Promise.resolve({ data: [], error: null }),
  ])
  const reviews = listed.error ? [] : (listed.data ?? [])
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
    : 0
  const google = Boolean(userData.user && usesGoogle(userData.user))

  return (
    <GlassCard>
      <h2>Отзиви</h2>
      {reviews.length > 0 ? (
        <p className="mt-3 text-sm font-medium">
          Средна оценка {average.toFixed(1)} от {reviews.length} {reviews.length === 1 ? "отзив" : "отзива"}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Все още няма публикувани отзиви.</p>
      )}
      {reviews.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3">
              <p className="text-sm font-medium">{Number(review.rating).toFixed(0)} / 5</p>
              {review.comment ? <p className="mt-1 text-sm leading-relaxed">{review.comment}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">{formatBgDate(review.created_at)}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {google ? (
        <ReviewForm doctorId={doctorId} facilityId={facilityId} slug={slug} />
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Отзиви могат да оставят потребители, влезли с Google.{" "}
          <Link href={`/login?next=/${slug}`} className="font-medium text-primary underline-offset-4 hover:underline">
            Вход
          </Link>
        </p>
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{disclaimer}</p>
    </GlassCard>
  )
}
