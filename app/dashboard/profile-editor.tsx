"use client"

import { useEffect } from "react"
import { useActionState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { updateOwnedProfile } from "@/app/dashboard/actions"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { WorkingHours } from "@/types/database"

const days: { key: keyof WorkingHours; label: string }[] = [
  { key: "monday", label: "Понеделник" },
  { key: "tuesday", label: "Вторник" },
  { key: "wednesday", label: "Сряда" },
  { key: "thursday", label: "Четвъртък" },
  { key: "friday", label: "Петък" },
  { key: "saturday", label: "Събота" },
  { key: "sunday", label: "Неделя" },
]

export function ProfileEditor({
  kind,
  id,
  slug,
  name,
  shortDescription,
  description,
  phone,
  email,
  website,
  hours,
  acceptsNhif,
  acceptsChildren,
  onlineConsultation,
}: {
  kind: "doctor" | "facility"
  id: string
  slug: string
  name: string
  shortDescription: string
  description: string
  phone: string
  email: string
  website: string
  hours: WorkingHours
  acceptsNhif: boolean
  acceptsChildren: boolean
  onlineConsultation: boolean
}) {
  const [state, action, pending] = useActionState(updateOwnedProfile, null)

  useEffect(() => {
    if (!state) return
    if (state.ok) toast.success(state.message)
    else toast.error(state.message)
  }, [state])

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{name}</p>
        <Link href={`/${slug}`} className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
          Преглед на публичната страница
        </Link>
      </div>

      <GlassCard variant="panel" className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="short_description">Кратко описание</Label>
          <textarea
            id="short_description"
            name="short_description"
            maxLength={280}
            rows={3}
            defaultValue={shortDescription}
            className="w-full rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 py-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Описание</Label>
          <textarea
            id="description"
            name="description"
            maxLength={5000}
            rows={8}
            defaultValue={description}
            className="w-full rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 py-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input id="phone" name="phone" defaultValue={phone} autoComplete="tel" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Имейл</Label>
            <Input id="email" name="email" type="email" defaultValue={email} autoComplete="email" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="website">Уебсайт</Label>
          <Input id="website" name="website" defaultValue={website} placeholder="https://" inputMode="url" />
        </div>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">Прием</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="accepts_nhif" defaultChecked={acceptsNhif} className="size-4 accent-primary" />
            НЗОК
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="accepts_children"
              defaultChecked={acceptsChildren}
              className="size-4 accent-primary"
            />
            Деца
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="online_consultation"
              defaultChecked={onlineConsultation}
              className="size-4 accent-primary"
            />
            Онлайн консултация
          </label>
        </fieldset>
      </GlassCard>

      <GlassCard variant="panel">
        <h2 className="text-lg font-semibold">Работно време</h2>
        <div className="mt-4 grid gap-3">
          {days.map((day) => {
            const schedule = hours[day.key]
            return (
              <div key={day.key} className="grid gap-2 rounded-xl bg-white/50 p-3 sm:grid-cols-[8rem_1fr_1fr_auto] sm:items-center">
                <span className="text-sm font-medium">{day.label}</span>
                <Input
                  aria-label={`${day.label} от`}
                  name={`${day.key}_open`}
                  type="time"
                  defaultValue={schedule?.open ?? ""}
                />
                <Input
                  aria-label={`${day.label} до`}
                  name={`${day.key}_close`}
                  type="time"
                  defaultValue={schedule?.close ?? ""}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={`${day.key}_closed`}
                    defaultChecked={schedule?.closed === true}
                    className="size-4 accent-primary"
                  />
                  Затворено
                </label>
              </div>
            )
          })}
        </div>
      </GlassCard>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        Запази
      </Button>
    </form>
  )
}
