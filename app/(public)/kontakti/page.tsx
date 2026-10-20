import { createPageMetadata } from "@/components/seo/page-meta"
import { GlassCard } from "@/components/ui/glass-card"

export const metadata = createPageMetadata({
  title: "Контакти",
  description: "Контакт със Здравен справочник.",
  path: "/kontakti",
  index: false,
})

export default function ContactPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:py-16">
      <h1>Контакти</h1>
      <GlassCard variant="panel" className="grid gap-3">
        <p className="leading-relaxed text-muted-foreground">
          За въпрос към екипа пишете на посочения адрес. Контактите на лекарите са в самите профили.
        </p>
        <p>
          <a className="font-medium text-primary hover:underline" href="mailto:hello@zdravenspravochnik.bg">
            hello@zdravenspravochnik.bg
          </a>
        </p>
      </GlassCard>
    </main>
  )
}
