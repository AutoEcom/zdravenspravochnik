"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"

import { deleteCategory, saveCategory, type CategoryFormState } from "@/app/admin/categories/actions"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { slugifyTitle } from "@/lib/content/slug"

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 py-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"

export function CategoryForm({
  id,
  name,
  slug,
  description,
  sortOrder,
  isPublished,
  colorAccent,
  coverImageUrl,
  saved = false,
  hidden = false,
}: {
  id?: string
  name: string
  slug: string
  description: string
  sortOrder: number
  isPublished: boolean
  colorAccent: string
  coverImageUrl: string
  saved?: boolean
  hidden?: boolean
}) {
  const [state, action, pending] = useActionState(saveCategory, null as CategoryFormState)
  const [nameValue, setNameValue] = useState(name)
  const [slugValue, setSlugValue] = useState(slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(id))

  useEffect(() => {
    if (saved) toast.success("Категорията е запазена.")
  }, [saved])

  useEffect(() => {
    if (!state) return
    if (state.ok) toast.success(state.message)
    else toast.error(state.message)
  }, [state])

  return (
    <div className="grid gap-4">
      {hidden ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Категорията има статии и не е изтрита. Маркирана е като скрита.
        </p>
      ) : null}
      <form action={action} className="grid gap-4">
        {id ? <input type="hidden" name="id" value={id} /> : null}
        <input type="hidden" name="previous_slug" value={slug} />
        <GlassCard variant="panel" className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Име</Label>
            <Input
              id="name"
              name="name"
              value={nameValue}
              maxLength={80}
              required
              onChange={(event) => {
                const next = event.target.value
                setNameValue(next)
                if (!slugTouched) setSlugValue(slugifyTitle(next, 80))
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Адрес</Label>
            <Input
              id="slug"
              name="slug"
              value={slugValue}
              maxLength={80}
              required
              onChange={(event) => {
                setSlugTouched(true)
                setSlugValue(slugifyTitle(event.target.value, 80))
              }}
            />
            <p className="text-sm text-muted-foreground">/articles/category/{slugValue || "adres"}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Описание</Label>
            <textarea
              id="description"
              name="description"
              maxLength={600}
              rows={4}
              defaultValue={description}
              className={fieldClass}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sort_order">Подредба</Label>
              <Input id="sort_order" name="sort_order" type="number" min={0} max={999} defaultValue={sortOrder} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color_accent">Акцент</Label>
              <Input id="color_accent" name="color_accent" defaultValue={colorAccent} placeholder="#0F766E" maxLength={7} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cover_image_url">Корица (URL)</Label>
            <Input
              id="cover_image_url"
              name="cover_image_url"
              type="url"
              inputMode="url"
              defaultValue={coverImageUrl}
              placeholder="https://"
            />
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="is_published" value="1" defaultChecked={isPublished} className="size-4 accent-primary" />
            Публикувана
          </label>
        </GlassCard>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Запис..." : "Запази"}
        </Button>
      </form>
      {id ? (
        <form action={deleteCategory}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Изтрий
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            Ако има статии, категорията се скрива и остава в базата.
          </p>
        </form>
      ) : null}
    </div>
  )
}
