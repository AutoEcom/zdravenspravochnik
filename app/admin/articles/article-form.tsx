"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { CoverField } from "@/app/admin/articles/cover-field"
import { saveArticle, type ArticleFormState } from "@/app/admin/articles/actions"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { slugifyTitle } from "@/lib/content/slug"

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 py-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"

function Count({ value, recommended }: { value: string; recommended: number }) {
  const over = value.length > recommended
  return (
    <p className={over ? "text-sm text-amber-700" : "text-sm text-muted-foreground"}>
      {value.length} символа · препоръчително до {recommended}
    </p>
  )
}

export function ArticleForm({
  id,
  title,
  slug,
  excerpt,
  content,
  status,
  coverImageUrl,
  metaTitle,
  metaDescription,
  ogImageUrl,
  saved = false,
}: {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  status: "draft" | "published"
  coverImageUrl: string
  metaTitle: string
  metaDescription: string
  ogImageUrl: string
  saved?: boolean
}) {
  const [state, action, pending] = useActionState(saveArticle, null as ArticleFormState)
  const [titleValue, setTitleValue] = useState(title)
  const [slugValue, setSlugValue] = useState(slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(id))
  const [metaTitleValue, setMetaTitleValue] = useState(metaTitle)
  const [metaDescriptionValue, setMetaDescriptionValue] = useState(metaDescription)

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
              if (!slugTouched) setSlugValue(slugifyTitle(next, 160))
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slug">Адрес</Label>
          <Input
            id="slug"
            name="slug"
            value={slugValue}
            maxLength={160}
            required
            onChange={(event) => {
              setSlugTouched(true)
              setSlugValue(slugifyTitle(event.target.value, 160))
            }}
          />
          <p className="text-sm text-muted-foreground">/articles/{slugValue || "adres"}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="excerpt">Кратко описание</Label>
          <textarea
            id="excerpt"
            name="excerpt"
            maxLength={500}
            rows={3}
            defaultValue={excerpt}
            className={fieldClass}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="content">Текст</Label>
          <textarea id="content" name="content" rows={14} maxLength={60000} defaultValue={content} className={fieldClass} />
          <p className="text-sm text-muted-foreground">
            Обикновен текст, markdown или чист HTML: абзаци, заглавия и списъци.
          </p>
        </div>
        <CoverField initialUrl={coverImageUrl} />
        <div className="grid gap-2">
          <Label htmlFor="meta_title">SEO заглавие</Label>
          <Input
            id="meta_title"
            name="meta_title"
            value={metaTitleValue}
            maxLength={70}
            onChange={(event) => setMetaTitleValue(event.target.value)}
          />
          <Count value={metaTitleValue} recommended={60} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="meta_description">SEO описание</Label>
          <textarea
            id="meta_description"
            name="meta_description"
            value={metaDescriptionValue}
            maxLength={180}
            rows={3}
            onChange={(event) => setMetaDescriptionValue(event.target.value)}
            className={fieldClass}
          />
          <Count value={metaDescriptionValue} recommended={160} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="og_image_url">OG изображение (URL)</Label>
          <Input
            id="og_image_url"
            name="og_image_url"
            type="url"
            inputMode="url"
            defaultValue={ogImageUrl}
            placeholder="https://"
          />
          <p className="text-sm text-muted-foreground">Ако е празно, се ползва корицата.</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Статус: {status === "published" ? "Публикувана" : "Чернова"}
        </p>
      </GlassCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="submit" name="intent" value="draft" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Запис..." : "Запази чернова"}
        </Button>
        <Button type="submit" name="intent" value="publish" variant="accent" disabled={pending} className="w-full sm:w-auto">
          Публикувай
        </Button>
        {status === "published" && slug ? (
          <Link
            href={`/articles/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
          >
            Преглед
          </Link>
        ) : null}
      </div>
    </form>
  )
}
