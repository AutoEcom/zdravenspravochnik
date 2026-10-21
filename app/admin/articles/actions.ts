"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getSessionProfile } from "@/lib/auth/session"
import { slugifyTitle } from "@/lib/content/slug"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ArticleInsert } from "@/types/database"

export type ArticleFormState = { ok: boolean; message: string } | null

function textValue(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max)
}

function cleanCover(value: string) {
  if (!value) return { value: null as string | null }
  if (!/^https:\/\/\S+$/i.test(value)) {
    return { error: "Адресът на изображението трябва да започва с https://." }
  }
  return { value }
}

async function requireAdmin() {
  const { user, profile } = await getSessionProfile()
  if (!user || profile?.role !== "admin") return null
  return user
}

export async function saveArticle(_prev: ArticleFormState, formData: FormData): Promise<ArticleFormState> {
  const user = await requireAdmin()
  if (!user) return { ok: false, message: "Само администратор може да записва статии." }

  const id = String(formData.get("id") ?? "").trim()
  const editing = /^[0-9a-f-]{36}$/i.test(id)
  const title = textValue(formData, "title", 180)
  const slugInput = textValue(formData, "slug", 80)
  const slug = slugifyTitle(slugInput || title)
  const excerpt = textValue(formData, "excerpt", 300)
  const content = textValue(formData, "content", 20000)
  const intent = String(formData.get("intent") ?? "save")
  const requested = String(formData.get("status") ?? "draft")
  const status = intent === "publish" || requested === "published" ? "published" : "draft"
  const previousSlug = slugifyTitle(String(formData.get("previous_slug") ?? ""))
  const cover = cleanCover(textValue(formData, "cover_image_url", 500))

  if (!title) return { ok: false, message: "Въведете заглавие." }
  if (!slug) return { ok: false, message: "Въведете адрес на статията." }
  if ("error" in cover && cover.error) return { ok: false, message: cover.error }
  if (status === "published" && content.length < 40) {
    return { ok: false, message: "Публикуваната статия трябва да има текст." }
  }

  const admin = createAdminClient()
  const { data: clash, error: clashError } = await admin.from("articles").select("id").eq("slug", slug).maybeSingle()
  if (clashError) return { ok: false, message: "Не успяхме да проверим адреса." }
  if (clash && clash.id !== id) return { ok: false, message: "Този адрес вече се използва." }

  let publishedAt: string | null = null
  if (editing) {
    const { data: current } = await admin.from("articles").select("published_at").eq("id", id).maybeSingle()
    publishedAt = current?.published_at ?? null
  }
  if (status === "published" && !publishedAt) publishedAt = new Date().toISOString()

  const payload: ArticleInsert = {
    title,
    slug,
    excerpt: excerpt || null,
    content,
    status,
    cover_url: cover.value,
    cover_image_url: cover.value,
    published_at: publishedAt,
    ...(editing ? {} : { author_id: user.id }),
  }

  const saved = await writeArticle(admin, editing ? id : null, payload)
  if ("error" in saved) return { ok: false, message: saved.error }

  revalidatePath("/articles")
  revalidatePath(`/articles/${saved.slug}`)
  revalidatePath("/")
  revalidatePath("/admin/articles")
  if (previousSlug && previousSlug !== saved.slug) {
    revalidatePath(`/articles/${previousSlug}`)
    revalidatePath(`/${previousSlug}`)
  }

  if (!editing) redirect(`/admin/articles/${saved.id}/edit?saved=1`)
  return {
    ok: true,
    message: status === "published" ? "Статията е публикувана." : "Черновата е запазена.",
  }
}

async function writeArticle(
  admin: ReturnType<typeof createAdminClient>,
  id: string | null,
  payload: ArticleInsert
): Promise<{ id: string; slug: string } | { error: string }> {
  const attempt = await persist(admin, id, payload)
  if (!attempt.error) return attempt.data
  if (!/cover_image_url/.test(attempt.error.message ?? "")) {
    return { error: "Записът не мина. Проверете полетата и опитайте отново." }
  }

  const withoutColumn = { ...payload }
  delete withoutColumn.cover_image_url
  const retry = await persist(admin, id, withoutColumn)
  if (retry.error) return { error: "Записът не мина. Пуснете supabase/migrations/005_articles_admin.sql в SQL Editor." }
  return retry.data
}

async function persist(
  admin: ReturnType<typeof createAdminClient>,
  id: string | null,
  payload: ArticleInsert
) {
  if (id) {
    const { data, error } = await admin.from("articles").update(payload).eq("id", id).select("id, slug").maybeSingle()
    if (error || !data) return { data: { id: "", slug: "" }, error: error ?? { message: "missing" } }
    return { data, error: null }
  }

  const { data, error } = await admin.from("articles").insert(payload).select("id, slug").single()
  if (error || !data) return { data: { id: "", slug: "" }, error: error ?? { message: "missing" } }
  return { data, error: null }
}
