import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"

export function PlaceCard({ address }: { address: string }) {
  const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  return (
    <GlassCard className="flex flex-col gap-4">
      <h2>Адрес</h2>
      <p>{address}</p>
      <div className="flex h-36 items-end rounded-2xl bg-slate-100/80 p-4">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          Отвори в Google Maps
        </a>
      </div>
    </GlassCard>
  )
}
