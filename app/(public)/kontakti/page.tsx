import { ContactForm } from "@/components/contact/contact-form"
import { createPageMetadata } from "@/components/seo/page-meta"
import { GlassCard } from "@/components/ui/glass-card"
import { operator } from "@/lib/operator"

export const metadata = createPageMetadata({
  title: "Контакти",
  description: "Пишете на екипа на Здравен справочник. Контактите на лекарите са в самите профили.",
  path: "/kontakti",
  index: false,
})

export default function ContactPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:py-16">
      <header>
        <h1>Контакти</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          За въпрос към екипа използвайте формата. Контактите на лекарите са в самите профили.
        </p>
      </header>
      <GlassCard variant="panel" className="grid gap-3 text-sm">
        <p>
          <span className="text-muted-foreground">Имейл · </span>
          <a className="font-medium text-primary hover:underline" href={`mailto:${operator.email}`}>
            {operator.email}
          </a>
        </p>
        <p>
          <span className="text-muted-foreground">Оператор · </span>
          {operator.name}
        </p>
        <p>
          <span className="text-muted-foreground">Адрес · </span>
          {operator.address}
        </p>
      </GlassCard>
      <GlassCard variant="panel">
        <h2 className="text-xl">Пишете ни</h2>
        <p className="mt-2 mb-5 text-sm leading-relaxed text-muted-foreground">
          Напишете накратко въпроса. Отговаряме обикновено до 1 работен ден.
        </p>
        <ContactForm kind="general" />
      </GlassCard>
    </main>
  )
}
