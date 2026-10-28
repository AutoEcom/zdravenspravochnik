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

function cleanHttps(value: string) {
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
  const slugInput = textValue(formData, "slug", 160)
  const slug = slugifyTitle(slugInput || title, 160)
  const excerpt = textValue(formData, "excerpt", 500)
  const content = textValue(formData, "content", 60000)
  const intent = String(formData.get("intent") ?? "save")
  const statusInput = String(formData.get("status") ?? "draft")
  const selected = statusInput === "published" || statusInput === "archived" ? statusInput : "draft"
  const status = intent === "publish" ? "published" : selected
  const previousSlug = slugifyTitle(String(formData.get("previous_slug") ?? ""), 160)
  const metaTitle = textValue(formData, "meta_title", 70)
  const metaDescription = textValue(formData, "meta_description", 180)
  const og = cleanHttps(textValue(formData, "og_image_url", 500))
  const coverInput = cleanHttps(textValue(formData, "cover_url", 500))

  if (!title) return { ok: false, message: "Въведете заглавие." }
  if (!slug) return { ok: false, message: "Въведете адрес на статията." }
  if ("error" in og && og.error) return { ok: false, message: og.error }
  if ("error" in coverInput && coverInput.error) return { ok: false, message: coverInput.error }
  if (status === "published" && content.length < 40) {
    return { ok: false, message: "Публикуваната статия трябва да има текст." }
  }

  const cover = coverInput.value
  const categoryId = String(formData.get("category_id") ?? "").trim()
  if (!/^[0-9a-f-]{36}$/i.test(categoryId)) return { ok: false, message: "Изберете категория." }

  const admin = createAdminClient()
  const { data: category, error: categoryError } = await admin
    .from("article_categories")
    .select("id, slug")
    .eq("id", categoryId)
    .maybeSingle()
  if (categoryError) {
    return { ok: false, message: "Пуснете supabase/migrations/007_article_categories.sql в SQL Editor." }
  }
  if (!category) return { ok: false, message: "Изберете категория." }

  const { data: clash, error: clashError } = await admin.from("articles").select("id").eq("slug", slug).maybeSingle()
  if (clashError) return { ok: false, message: "Не успяхме да проверим адреса." }
  if (clash && clash.id !== id) return { ok: false, message: "Този адрес вече се използва." }

  let publishedAt: string | null = null
  let previousCategoryId: string | null = null
  if (editing) {
    const { data: current, error: currentError } = await admin
      .from("articles")
      .select("published_at, category_id")
      .eq("id", id)
      .maybeSingle()
    if (currentError) {
      return {
        ok: false,
        message: /category_id/i.test(currentError.message)
          ? "Пуснете supabase/migrations/007_article_categories.sql в SQL Editor."
          : "Не успяхме да заредим статията.",
      }
    }
    publishedAt = current?.published_at ?? null
    previousCategoryId = current?.category_id ?? null
  }
  if (status === "published" && !publishedAt) publishedAt = new Date().toISOString()

  const payload: ArticleInsert = {
    title,
    slug,
    excerpt: excerpt || null,
    content,
    status,
    category_id: category.id,
    cover_url: cover,
    cover_image_url: cover,
    og_image_url: og.value,
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    published_at: publishedAt,
    ...(editing ? {} : { author_id: user.id, source: "site" }),
  }

  const saved = await writeArticle(admin, editing ? id : null, payload)
  if ("error" in saved) return { ok: false, message: saved.error }

  revalidatePath("/articles")
  revalidatePath(`/articles/${saved.slug}`)
  revalidatePath(`/${saved.slug}`)
  revalidatePath(`/articles/category/${category.slug}`)
  revalidatePath("/")
  revalidatePath("/admin/articles")
  revalidatePath("/admin/categories")
  revalidatePath("/sitemap.xml")
  if (previousSlug && previousSlug !== saved.slug) {
    revalidatePath(`/articles/${previousSlug}`)
    revalidatePath(`/${previousSlug}`)
  }
  if (previousCategoryId && previousCategoryId !== category.id) {
    const { data: previousCategory } = await admin
      .from("article_categories")
      .select("slug")
      .eq("id", previousCategoryId)
      .maybeSingle()
    if (previousCategory?.slug) revalidatePath(`/articles/category/${previousCategory.slug}`)
  }

  const base =
    status === "published" ? "Статията е публикувана." : status === "archived" ? "Статията е архивирана." : "Черновата е запазена."
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
    if (column === "category_id") {
      return { error: "Категорията не се записа. Пуснете supabase/migrations/007_article_categories.sql в SQL Editor." }
    }
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
