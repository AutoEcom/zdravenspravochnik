import type { Doctor, WorkingHours } from "@/types/database"

import { JsonLd } from "@/components/seo/json-ld"
import { physicianJsonLd } from "@/components/seo/schemas"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"

const days: { key: keyof WorkingHours; label: string }[] = [
  { key: "monday", label: "Понеделник" },
  { key: "tuesday", label: "Вторник" },
  { key: "wednesday", label: "Сряда" },
  { key: "thursday", label: "Четвъртък" },
  { key: "friday", label: "Петък" },
  { key: "saturday", label: "Събота" },
  { key: "sunday", label: "Неделя" },
]

export function DoctorProfile({ doctor }: { doctor: Doctor }) {
  const name = [doctor.title, doctor.full_name].filter(Boolean).join(" ")
  const hours = days.flatMap((day) => {
    const schedule = doctor.working_hours?.[day.key]
    if (!schedule) return []
    const value = schedule.closed
      ? "Затворено"
      : [schedule.open, schedule.close].filter(Boolean).join(" – ")
    return value ? [{ label: day.label, value }] : []
  })

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:py-16">
      <JsonLd data={physicianJsonLd(doctor)} />
      <GlassCard variant="strong" className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {doctor.is_premium ? <Badge variant="accent">Премиум</Badge> : null}
          {doctor.is_featured ? <Badge>Препоръчан</Badge> : null}
        </div>
        <h1>{name}</h1>
        <p className="text-muted-foreground">
          {[doctor.specialties.join(", "), doctor.cities.join(", ")]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {doctor.review_count > 0 ? (
          <p className="text-sm font-medium">
            Оценка {doctor.rating.toFixed(1)} от {doctor.review_count} отзива
          </p>
        ) : null}
        {doctor.bio ? <p className="leading-relaxed">{doctor.bio}</p> : null}
      </GlassCard>

      <GlassCard className="grid gap-3 text-sm">
        <h2>Контакт</h2>
        {doctor.phone ? (
          <p>
            <a className="text-primary hover:underline" href={`tel:${doctor.phone}`}>
              {doctor.phone}
            </a>
          </p>
        ) : null}
        {doctor.email ? (
          <p>
            <a className="text-primary hover:underline" href={`mailto:${doctor.email}`}>
              {doctor.email}
            </a>
          </p>
        ) : null}
        {doctor.address ? <p>{doctor.address}</p> : null}
        {doctor.website ? (
          <p>
            <a
              className="text-primary hover:underline"
              href={doctor.website}
              rel="noopener noreferrer"
              target="_blank"
            >
              Уебсайт
            </a>
          </p>
        ) : null}
        {!doctor.phone && !doctor.email && !doctor.address && !doctor.website ? (
          <p className="text-muted-foreground">Контактът ще бъде добавен скоро.</p>
        ) : null}
      </GlassCard>

      {hours.length > 0 ? (
        <GlassCard>
          <h2>Работно време</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            {hours.map((slot) => (
              <div key={slot.label} className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{slot.label}</dt>
                <dd>{slot.value}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>
      ) : null}
    </main>
  )
}
