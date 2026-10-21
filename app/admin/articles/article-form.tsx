"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { saveArticle, type ArticleFormState } from "@/app/admin/articles/actions"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { slugifyTitle } from "@/lib/content/slug"

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 py-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"

export function ArticleForm({
  id,
  title,
  slug,
  excerpt,
  content,
  status,
  coverImageUrl,
  saved = false,
}: {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  status: "draft" | "published"
  coverImageUrl: string
  saved?: boolean
}) {
  const [state, action, pending] = useActionState(saveArticle, null as ArticleFormState)
  const [titleValue, setTitleValue] = useState(title)
  const [slugValue, setSlugValue] = useState(slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(id))

  useEffect(() => {
    if (saved) toast.success("Статията е запазена.")
  }, [saved])

  useEffect(() => {
    if (!state) return
    if (state.ok) toast.success(state.message)
    else toast.error(state.message)
  }, [state])

  return (
    <form action={action} className="grid gap-4">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <input type="hidden" name="previous_slug" value={slug} />
      <GlassCard variant="panel" className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Заглавие</Label>
          <Input
            id="title"
            name="title"
            value={titleValue}
            maxLength={180}
            required
            onChange={(event) => {
              const next = event.target.value
              setTitleValue(next)
              if (!slugTouched) setSlugValue(slugifyTitle(next))
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
              setSlugValue(slugifyTitle(event.target.value))
            }}
          />
          <p className="text-sm text-muted-foreground">/articles/{slugValue || "adres"}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="excerpt">Кратко описание</Label>
          <textarea
            id="excerpt"
            name="excerpt"
            maxLength={300}
            rows={3}
            defaultValue={excerpt}
            className={fieldClass}
          />
          <p className="text-sm text-muted-foreground">Това е описанието за търсачки и картите в списъка.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="content">Текст</Label>
          <textarea id="content" name="content" rows={14} maxLength={20000} defaultValue={content} className={fieldClass} />
          <p className="text-sm text-muted-foreground">
            Обикновен текст или markdown: празен ред за нов абзац, ## за подзаглавие, - за списък.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cover_image_url">Изображение (URL)</Label>
          <Input
            id="cover_image_url"
            name="cover_image_url"
            type="url"
            inputMode="url"
            defaultValue={coverImageUrl}
            placeholder="https://"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Статус</Label>
          <select id="status" name="status" defaultValue={status} className={fieldClass}>
            <option value="draft">Чернова</option>
            <option value="published">Публикувана</option>
          </select>
        </div>
      </GlassCard>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" name="intent" value="save" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Запис..." : "Запази"}
        </Button>
        <Button type="submit" name="intent" value="publish" variant="accent" disabled={pending} className="w-full sm:w-auto">
          Публикувай
        </Button>
        {status === "published" && slug ? (
          <Link href={`/articles/${slug}`} className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
            Отвори публичната страница
          </Link>
        ) : null}
      </div>
    </form>
  )
}
