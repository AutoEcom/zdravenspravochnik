"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { saveProfile, type ProfileFormState } from "@/app/admin/profiles/actions"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cleanDisplayName } from "@/lib/content/display-name"
import type { FacilityType, PublishStatus } from "@/types/database"

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 py-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"

const facilityTypes: { value: FacilityType; label: string }[] = [
  { value: "hospital", label: "Болница" },
  { value: "clinic", label: "Медицински център" },
  { value: "practice", label: "Практика" },
  { value: "laboratory", label: "Лаборатория" },
  { value: "pharmacy", label: "Аптека" },
  { value: "other", label: "Лечебно заведение" },
]

function slugNote(source: string | null) {
  if (source === "legacy_wp") return "Адресът е от стария сайт и остава непроменен."
  if (source === "nhif") return "Адресът е от НЗОК и остава непроменен, за да не се счупят връзките."
  return "Адресът остава непроменен."
}

function sourceLabel(source: string | null) {
  if (source === "legacy_wp") return "Стар сайт"
  if (source === "nhif") return "НЗОК"
  return source || "—"
}

function isChosen(option: { slug: string; aliases?: string[] }, selected: string[]) {
  const chosen = new Set(selected.map((slug) => slug.trim().toLocaleLowerCase("bg")))
  return [option.slug, ...(option.aliases ?? [])].some((slug) => chosen.has(slug.trim().toLocaleLowerCase("bg")))
}

function SlugChecks({
  name,
  label,
  options,
  selected,
}: {
  name: string
  label: string
  options: { slug: string; name: string; aliases?: string[] }[]
  selected: string[]
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      {options.length > 0 ? (
        <div className="grid max-h-56 gap-2 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/50 p-3 sm:grid-cols-2">
          {options.map((option) => (
            <label key={`${name}-${option.slug}`} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name={name}
                value={option.slug}
                defaultChecked={isChosen(option, selected)}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>{option.name}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Няма записи в каталога.</p>
      )}
    </fieldset>
  )
}

export function AdminProfileForm({
  kind,
  id,
  slug,
  source,
  isClaimed,
  claimedBy,
  title,
  name,
  shortDescription,
  description,
  phone,
  email,
  website,
  address,
  cities,
  specialties,
  cityOptions,
  specialtyOptions,
  acceptsNhif,
  acceptsChildren,
  onlineConsultation,
  featured,
  status,
  facilityType,
}: {
  kind: "doctor" | "facility"
  id: string
  slug: string
  source: string | null
  isClaimed: boolean
  claimedBy: string | null
  title: string
  name: string
  shortDescription: string
  description: string
  phone: string
  email: string
  website: string
  address: string
  cities: string[]
  specialties: string[]
  cityOptions: { slug: string; name: string; aliases?: string[] }[]
  specialtyOptions: { slug: string; name: string; aliases?: string[] }[]
  acceptsNhif: boolean
  acceptsChildren: boolean
  onlineConsultation: boolean
  featured: boolean
  status: PublishStatus
  facilityType: FacilityType
}) {
  const [state, action, pending] = useActionState(saveProfile, null as ProfileFormState)
  const [nameValue, setNameValue] = useState(name)

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
        <Link href="/admin/profiles" className="text-sm text-primary underline-offset-4 hover:underline">
          Към профилите
        </Link>
        {status === "published" ? (
          <Link
            href={`/${encodeURIComponent(slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
          >
            Преглед
          </Link>
        ) : null}
      </div>

      <GlassCard variant="panel" className="grid gap-4">
        {kind === "doctor" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Титла</Label>
              <Input id="title" name="title" defaultValue={title} maxLength={120} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Име</Label>
              <Input id="name" name="name" defaultValue={name} maxLength={200} required />
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="name">Име</Label>
            <Input
              id="name"
              name="name"
              value={nameValue}
              maxLength={200}
              required
              onChange={(event) => setNameValue(event.target.value)}
            />
            <p className="text-sm text-muted-foreground">На сайта: {cleanDisplayName(nameValue) || "—"}</p>
          </div>
        )}

        {kind === "facility" ? (
          <div className="grid gap-2">
            <Label htmlFor="facility_type">Тип</Label>
            <select id="facility_type" name="facility_type" defaultValue={facilityType} className={fieldClass}>
              {facilityTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="short_description">Кратко описание</Label>
          <textarea
            id="short_description"
            name="short_description"
            maxLength={600}
            rows={3}
            defaultValue={shortDescription}
            className={fieldClass}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Описание</Label>
          <textarea
            id="description"
            name="description"
            maxLength={20000}
            rows={8}
            defaultValue={description}
            className={fieldClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input id="phone" name="phone" defaultValue={phone} autoComplete="tel" maxLength={40} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Имейл</Label>
            <Input id="email" name="email" type="email" defaultValue={email} autoComplete="email" maxLength={160} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="website">Уебсайт</Label>
          <Input id="website" name="website" defaultValue={website} placeholder="https://" inputMode="url" maxLength={300} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Адрес</Label>
          <Input id="address" name="address" defaultValue={address} maxLength={300} />
        </div>
        <SlugChecks name="cities" label="Градове" options={cityOptions} selected={cities} />
        <SlugChecks name="specialties" label="Специалности" options={specialtyOptions} selected={specialties} />
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">Прием</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="accepts_nhif" defaultChecked={acceptsNhif} className="size-4 accent-primary" />
            НЗОК
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="accepts_children" defaultChecked={acceptsChildren} className="size-4 accent-primary" />
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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_featured" defaultChecked={featured} className="size-4 accent-primary" />
            Препоръчан
          </label>
        </fieldset>
        <div className="grid gap-2">
          <Label htmlFor="status">Статус</Label>
          <select id="status" name="status" defaultValue={status} className={fieldClass}>
            <option value="published">Публикуван</option>
            <option value="draft">Чернова</option>
            <option value="archived">Архив</option>
          </select>
        </div>
      </GlassCard>

      <GlassCard variant="panel" className="grid gap-2 text-sm">
        <p>
          <span className="text-muted-foreground">Адрес: </span>
          <span className="font-medium">/{slug}</span>
        </p>
        <p className={source === "nhif" ? "text-amber-800" : "text-muted-foreground"}>{slugNote(source)}</p>
        <p>
          <span className="text-muted-foreground">Източник: </span>
          {sourceLabel(source)}
        </p>
        <p>
          <span className="text-muted-foreground">Зает профил: </span>
          {isClaimed ? "да" : "не"}
        </p>
        <p className="break-all">
          <span className="text-muted-foreground">Зает от: </span>
          {claimedBy || "—"}
        </p>
      </GlassCard>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Запис..." : "Запази"}
      </Button>
    </form>
  )
}
