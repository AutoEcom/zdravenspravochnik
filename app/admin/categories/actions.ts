"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getSessionProfile } from "@/lib/auth/session"
import { slugifyTitle } from "@/lib/content/slug"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ArticleCategoryInsert } from "@/types/database"

export type CategoryFormState = { ok: boolean; message: string } | null

const migrationHint = "Пуснете supabase/migrations/007_article_categories.sql в SQL Editor."

function textValue(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max)
}

async function requireAdmin() {
  const { user, profile } = await getSessionProfile()
  if (!user || profile?.role !== "admin") return null
  return user
}

function revalidateCategory(slug: string) {
  revalidatePath("/articles")
  revalidatePath(`/articles/category/${slug}`)
  revalidatePath("/")
  revalidatePath("/admin/categories")
  revalidatePath("/admin/articles")
  revalidatePath("/sitemap.xml")
}

export async function saveCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const user = await requireAdmin()
  if (!user) return { ok: false, message: "Само администратор може да записва категории." }

  const id = String(formData.get("id") ?? "").trim()
  const editing = /^[0-9a-f-]{36}$/i.test(id)
  const name = textValue(formData, "name", 80)
  const slug = slugifyTitle(textValue(formData, "slug", 80) || name, 80)
  const description = textValue(formData, "description", 600)
  const accent = textValue(formData, "color_accent", 7)
  const cover = textValue(formData, "cover_image_url", 500)
  const sortRaw = Number(String(formData.get("sort_order") ?? "").trim())
  const sortOrder = Number.isInteger(sortRaw) ? Math.min(999, Math.max(0, sortRaw)) : 0
  const isPublished = formData.get("is_published") === "1"
  const previousSlug = slugifyTitle(String(formData.get("previous_slug") ?? ""), 80)

  if (!name) return { ok: false, message: "Въведете име." }
  if (!slug) return { ok: false, message: "Въведете адрес на категорията." }
  if (accent && !/^#[0-9A-Fa-f]{6}$/.test(accent)) {
    return { ok: false, message: "Акцентът трябва да е цвят като #0F766E." }
  }
  if (cover && !/^https:\/\/\S+$/i.test(cover)) {
    return { ok: false, message: "Адресът на изображението трябва да започва с https://." }
  }

  const admin = createAdminClient()
  const { data: clash, error: clashError } = await admin
    .from("article_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()
  if (clashError) return { ok: false, message: migrationHint }
  if (clash && clash.id !== id) return { ok: false, message: "Този адрес вече се използва." }

  const payload: ArticleCategoryInsert = {
    name,
    slug,
    description: description || null,
    color_accent: accent ? accent.toUpperCase() : null,
    cover_image_url: cover || null,
    sort_order: sortOrder,
    is_published: isPublished,
  }

  if (editing) {
    const { data, error } = await admin
      .from("article_categories")
      .update(payload)
      .eq("id", id)
      .select("id, slug")
      .maybeSingle()
    if (error || !data) return { ok: false, message: "Записът не мина." }
    revalidateCategory(data.slug)
    if (previousSlug && previousSlug !== data.slug) revalidateCategory(previousSlug)
    return { ok: true, message: isPublished ? "Категорията е публикувана." : "Категорията е запазена като скрита." }
  }

  const { data, error } = await admin.from("article_categories").insert(payload).select("id, slug").single()
  if (error || !data) return { ok: false, message: migrationHint }
  revalidateCategory(data.slug)
  redirect(`/admin/categories/${data.id}/edit?saved=1`)
}

export async function deleteCategory(formData: FormData) {
  const user = await requireAdmin()
  if (!user) redirect("/dashboard")

  const id = String(formData.get("id") ?? "").trim()
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/categories")

  const admin = createAdminClient()
  const { data: category } = await admin.from("article_categories").select("id, slug").eq("id", id).maybeSingle()
  if (!category) redirect("/admin/categories")

  const { count } = await admin
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)

  if ((count ?? 0) > 0) {
    await admin.from("article_categories").update({ is_published: false }).eq("id", id)
    revalidateCategory(category.slug)
    redirect(`/admin/categories/${id}/edit?hidden=1`)
  }

  const { error } = await admin.from("article_categories").delete().eq("id", id)
  if (error) redirect(`/admin/categories/${id}/edit?hidden=1`)
  revalidateCategory(category.slug)
  redirect("/admin/categories?deleted=1")
}
