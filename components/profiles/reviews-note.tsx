import { reviewLabel } from "@/lib/content/present"
import { GlassCard } from "@/components/ui/glass-card"

export function ReviewsNote({ rating, count }: { rating: number; count: number }) {
  return (
    <GlassCard>
      <h2>Отзиви</h2>
      {count > 0 ? (
        <p className="mt-3 text-sm font-medium">
          Средна оценка {rating.toFixed(1)} от {reviewLabel(count)}
        </p>
      ) : null}
      <p className="mt-2 text-muted-foreground">Очаквайте скоро</p>
    </GlassCard>
  )
}
