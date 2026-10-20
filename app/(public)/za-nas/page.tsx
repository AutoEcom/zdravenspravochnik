import { createPageMetadata } from "@/components/seo/page-meta"
import { GlassCard } from "@/components/ui/glass-card"

export const metadata = createPageMetadata({
  title: "За нас",
  description: "Здравен справочник събира публични профили на лекари и лечебни заведения в България.",
  path: "/za-nas",
  index: false,
})

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:py-16">
      <h1>За нас</h1>
      <GlassCard variant="panel">
        <p className="leading-relaxed text-muted-foreground">
          Здравен справочник помага да намерите лекар или лечебно заведение по специалност и град.
          Профилите показват контакт, работно време и адрес, когато са публикувани.
        </p>
      </GlassCard>
    </main>
  )
}
