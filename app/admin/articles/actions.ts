"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getSessionProfile } from "@/lib/auth/session"
import { slugifyTitle } from "@/lib/content/slug"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ArticleInsert } from "@/types/database"

export type ArticleFormState = { ok: boolean; message: string } | null

const bucket = "article-covers"
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"])

function textValue(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max)
}

function cleanHttps(value: string) {
  if (!value) return { value: null as string | null }
  if (!/^https:\/\/\S+$/i.test(value)) {
    return { error: "Адресът на изображението трябва да започва с https://." }
  }
  return { value }
}

function sniffImage(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  if (type === "image/webp") {
    const head = new TextDecoder().decode(bytes.slice(0, 12))
    return head.startsWith("RIFF") && head.slice(8, 12) === "WEBP"
  }
  return false
}

async function requireAdmin() {
  const { user, profile } = await getSessionProfile()
  if (!user || profile?.role !== "admin") return null
  return user
}

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const existing = await admin.storage.getBucket(bucket)
  if (existing.data) return
  const created = await admin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  })
  if (created.error && !/already exists/i.test(created.error.message)) {
    throw new Error(created.error.message)
  }
}

async function uploadCover(file: File) {
  if (!imageTypes.has(file.type)) return { error: "Приемат се само JPEG, PNG и WebP." }
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) return { error: "Снимката трябва да е до 5 MB." }
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!sniffImage(bytes, file.type)) return { error: "Файлът не е валидно изображение." }

  const admin = createAdminClient()
  await ensureBucket(admin)
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const path = `${crypto.randomUUID()}.${extension}`
  const uploaded = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  })
  if (uploaded.error) return { error: "Качването на корицата не мина." }
  const { data } = admin.storage.from(bucket).getPublicUrl(path)
  return { value: data.publicUrl }
}

export async function saveArticle(_prev: ArticleFormState, formData: FormData): Promise<ArticleFormState> {
  const user = await requireAdmin()
  if (!user) return { ok: false, message: "Само администратор може да записва статии." }

  const id = String(formData.get("id") ?? "").trim()
  const editing = /^[0-9a-f-]{36}$/i.test(id)
  const title = textValue(formData, "title", 180)
  const slugInput = textValue(formData, "slug", 160)
  const slug = slugifyTitle(slugInput || title, 160)
  const excerpt = textValue(formData, "excerpt", 500)
  const content = textValue(formData, "content", 60000)
  const intent = String(formData.get("intent") ?? "draft")
  const status = intent === "publish" ? "published" : "draft"
  const previousSlug = slugifyTitle(String(formData.get("previous_slug") ?? ""), 160)
  const metaTitle = textValue(formData, "meta_title", 70)
  const metaDescription = textValue(formData, "meta_description", 180)
  const og = cleanHttps(textValue(formData, "og_image_url", 500))
  const removeCover = String(formData.get("remove_cover") ?? "") === "1"
  const existingCover = cleanHttps(textValue(formData, "existing_cover", 500))
  const file = formData.get("cover_file")

  if (!title) return { ok: false, message: "Въведете заглавие." }
  if (!slug) return { ok: false, message: "Въведете адрес на статията." }
  if ("error" in og && og.error) return { ok: false, message: og.error }
  if ("error" in existingCover && existingCover.error) return { ok: false, message: existingCover.error }
  if (status === "published" && content.length < 40) {
    return { ok: false, message: "Публикуваната статия трябва да има текст." }
  }

  let cover = removeCover ? null : existingCover.value
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadCover(file).catch(() => ({ error: "Качването на корицата не мина." }))
    if ("error" in uploaded && uploaded.error) return { ok: false, message: uploaded.error }
    if ("value" in uploaded) cover = uploaded.value
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
    cover_url: cover,
    cover_image_url: cover,
    og_image_url: og.value,
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    published_at: publishedAt,
    ...(editing ? {} : { author_id: user.id }),
  }

  const saved = await writeArticle(admin, editing ? id : null, payload)
  if ("error" in saved) return { ok: false, message: saved.error }

  revalidatePath("/articles")
  revalidatePath(`/articles/${saved.slug}`)
  revalidatePath("/")
  revalidatePath("/admin/articles")
  revalidatePath("/sitemap.xml")
  if (previousSlug && previousSlug !== saved.slug) {
    revalidatePath(`/articles/${previousSlug}`)
  }

  const base = status === "published" ? "Статията е публикувана." : "Черновата е запазена."
  const message = saved.dropped.length
    ? `${base} Пуснете supabase/migrations/006_articles_seo.sql, за да се пазят SEO полетата.`
    : base
  if (!editing) redirect(`/admin/articles/${saved.id}/edit?saved=1`)
  return { ok: true, message }
}

async function writeArticle(
  admin: ReturnType<typeof createAdminClient>,
  id: string | null,
  payload: ArticleInsert
): Promise<{ id: string; slug: string; dropped: string[] } | { error: string }> {
  const current: ArticleInsert = { ...payload }
  const dropped: string[] = []
  for (let attempt = 0; attempt < 6; attempt++) {
    const result = await persist(admin, id, current)
    if (!result.error) return { ...result.data, dropped }
    const missing = result.error.message?.match(/'([a-z_]+)' column|column "([a-z_]+)"/i)
    const column = missing?.[1] || missing?.[2]
    if (!column || !(column in current)) {
      return { error: "Записът не мина. Пуснете supabase/migrations/006_articles_seo.sql в SQL Editor." }
    }
    delete current[column as keyof ArticleInsert]
    dropped.push(column)
  }
  return { error: "Записът не мина. Пуснете supabase/migrations/006_articles_seo.sql в SQL Editor." }
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
