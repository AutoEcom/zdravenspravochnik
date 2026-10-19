import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { DialogPreview } from "@/app/design-system/dialog-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Дизайн система",
  robots: { index: false, follow: false },
}

const colors = [
  { name: "Primary", value: "#0F766E", className: "bg-primary" },
  { name: "Primary soft", value: "#14B8A6", className: "bg-primary-soft" },
  { name: "Background", value: "#F8FAFC", className: "bg-background" },
  { name: "Text", value: "#0F172A", className: "bg-foreground" },
  { name: "Text secondary", value: "#64748B", className: "bg-muted-foreground" },
  { name: "Accent", value: "#0EA5E9", className: "bg-accent" },
  { name: "Success", value: "#10B981", className: "bg-success" },
  { name: "Warning", value: "#F59E0B", className: "bg-warning" },
  { name: "Danger", value: "#EF4444", className: "bg-danger" },
]

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound()
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Development</p>
        <h1>Дизайн система</h1>
        <p className="max-w-2xl text-muted-foreground">
          Светла тема с teal, небесен акцент и стъклени повърхности. Страницата
          е достъпна само в development.
        </p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="type-heading">
        <h2 id="type-heading">Типография</h2>
        <GlassCard className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              H1
            </p>
            <p className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              Заглавие от първо ниво
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              H2
            </p>
            <p className="text-2xl leading-tight font-semibold tracking-tight">
              Заглавие от второ ниво
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              H3
            </p>
            <p className="text-lg leading-snug font-semibold tracking-tight">
              Заглавие от трето ниво
            </p>
          </div>
          <p>
            Основен текст за описания, профили и резултати от търсене. Размерът
            остава четим на телефон.
          </p>
          <p className="text-muted-foreground">
            Вторичен текст за помощ, метаданни и по-тихи пояснения.
          </p>
        </GlassCard>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="colors-heading">
        <h2 id="colors-heading">Цветове</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {colors.map((color) => (
            <li key={color.name}>
              <GlassCard className="flex items-center gap-3 p-3 sm:p-4">
                <span
                  className={`size-10 shrink-0 rounded-xl border border-slate-200/80 ${color.className}`}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{color.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {color.value}
                  </span>
                </span>
              </GlassCard>
            </li>
          ))}
          <li>
            <GlassCard className="flex items-center gap-3 p-3 sm:p-4">
              <span
                className="glass size-10 shrink-0 rounded-xl"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">Glass</span>
                <span className="block text-xs text-muted-foreground">
                  rgba(255, 255, 255, 0.72)
                </span>
              </span>
            </GlassCard>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="glass-heading">
        <h2 id="glass-heading">GlassCard</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <GlassCard>
            <h3>Default</h3>
            <p className="mt-2 text-muted-foreground">
              Полупрозрачен фон, мека граница и blur от 24px.
            </p>
          </GlassCard>
          <GlassCard variant="strong">
            <h3>Strong</h3>
            <p className="mt-2 text-muted-foreground">
              По-плътно стъкло за диалози и важни панели.
            </p>
          </GlassCard>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="buttons-heading">
        <h2 id="buttons-heading">Бутони</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="inputs-heading">
        <h2 id="inputs-heading">Полета</h2>
        <GlassCard className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="doctor-name">Име</Label>
            <Input id="doctor-name" name="doctor-name" placeholder="Д-р Иванова" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doctor-email">Имейл</Label>
            <Input
              id="doctor-email"
              name="doctor-email"
              type="email"
              defaultValue="невалиден"
              aria-invalid="true"
              aria-describedby="doctor-email-error"
            />
            <p id="doctor-email-error" className="text-sm text-danger-foreground">
              Въведете валиден имейл.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doctor-city">Град</Label>
            <Input id="doctor-city" name="doctor-city" defaultValue="София" disabled />
          </div>
        </GlassCard>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="badges-heading">
        <h2 id="badges-heading">Баджове</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Primary</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Danger</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="skeleton-heading">
        <h2 id="skeleton-heading">Skeleton</h2>
        <GlassCard aria-busy="true" aria-live="polite">
          <span className="sr-only">Зареждане на съдържание</span>
          <div className="grid gap-3" aria-hidden="true">
            <Skeleton className="h-6 w-2/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-24 w-full" />
          </div>
        </GlassCard>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="dialog-heading">
        <h2 id="dialog-heading">Диалог</h2>
        <DialogPreview />
      </section>

      <p>
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Към началото
        </Link>
      </p>
    </main>
  )
}
