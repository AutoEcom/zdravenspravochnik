import { createPageMetadata } from "@/components/seo/page-meta"
import { GlassCard } from "@/components/ui/glass-card"

export const metadata = createPageMetadata({
  title: "Женско здраве",
  description: "Направление за женско здраве в Здравен справочник. Страницата се допълва.",
  path: "/jensko-zdrave",
  index: false,
})

export default function WomensHealthPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-primary">Направление</p>
      <h1>Женско здраве</h1>
      <GlassCard variant="panel">
        <p className="leading-relaxed text-muted-foreground">
          Тук ще съберем специалисти и заведения за женско здраве. Дотогава потърсете
          акушер-гинеколог през търсачката.
        </p>
      </GlassCard>
    </main>
  )
}
