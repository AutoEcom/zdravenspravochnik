import { Star } from "lucide-react"

import { ReviewForm } from "@/components/profiles/review-form"
import { ReviewLogin } from "@/components/profiles/review-login"
import { ViewTotal } from "@/components/profiles/view-count"
import { GlassCard } from "@/components/ui/glass-card"
import { formatBgDate, reviewLabel } from "@/lib/content/present"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

const disclaimer =
  "Отзивите са от потребители с Google акаунт. Здравен справочник не гарантира медицинска точност на мненията и не препоръчва конкретен специалист."

function usesGoogle(user: User) {
  return user.app_metadata?.provider === "google" || (user.identities ?? []).some((identity) => identity.provider === "google")
}

const sourceNote =
  "Оценките са на база отзиви в Google. Нови отзиви тук са само от потребители с Google акаунт."

export async function ProfileReviews({
  doctorId,
  facilityId,
  slug,
  rating = 0,
  reviewCount = 0,
  viewCount = 0,
}: {
  doctorId?: string
  facilityId?: string
  slug: string
  rating?: number | null
  reviewCount?: number | null
  viewCount?: number | null
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
  const listedCount = reviewCount ?? 0
  const listedRating = rating ?? 0

  return (
    <GlassCard>
      <h2>Отзиви</h2>
      {reviews.length > 0 ? (
        <p className="mt-3 text-sm font-medium">
          Средна оценка {average.toFixed(1)} от {reviews.length} {reviews.length === 1 ? "отзив" : "отзива"}
        </p>
      ) : listedCount > 0 ? (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Star className="size-4 fill-warning text-warning" />
            {listedRating.toFixed(1)}
            <span className="font-normal text-muted-foreground">· {reviewLabel(listedCount)}</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sourceNote}</p>
        </div>
      ) : (
        <div className="mt-3">
          <ViewTotal count={viewCount ?? 0} />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sourceNote}</p>
        </div>
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
          Отзиви могат да оставят потребители, влезли с Google. <ReviewLogin next={`/${slug}`} />
        </p>
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{disclaimer}</p>
    </GlassCard>
  )
}
