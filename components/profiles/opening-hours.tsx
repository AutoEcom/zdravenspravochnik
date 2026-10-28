import type { WorkingHours } from "@/types/database"

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

export function openingHourRows(hours: WorkingHours | null | undefined) {
  if (!hours) return []
  return days.flatMap((day) => {
    const schedule = hours[day.key]
    if (!schedule) return []
    const value = schedule.closed
      ? "Затворено"
      : [schedule.open, schedule.close].filter(Boolean).join(" – ")
    return value ? [{ label: day.label, value }] : []
  })
}

export function OpeningHours({ hours }: { hours: WorkingHours | null | undefined }) {
  const rows = openingHourRows(hours)
  if (rows.length === 0) return null

  return (
    <GlassCard>
      <h2>Работно време</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        {rows.map((slot) => (
          <div key={slot.label} className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{slot.label}</dt>
            <dd>{slot.value}</dd>
          </div>
        ))}
      </dl>
    </GlassCard>
  )
}
