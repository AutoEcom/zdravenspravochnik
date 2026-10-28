import { notFound, redirect } from "next/navigation"

import { CategoryForm } from "@/app/admin/categories/category-form"
import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getSessionProfile } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = createPageMetadata({
  title: "Редакция на категория",
  description: "Редакция на категория за Полезно.",
  path: "/admin/categories",
  index: false,
})

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; hidden?: string }>
}) {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect("/login?next=/admin/categories")
  if (profile?.role !== "admin") redirect("/dashboard")

  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const admin = createAdminClient()
  const { data } = await admin.from("article_categories").select("*").eq("id", id).maybeSingle()
  if (!data) notFound()

  const { saved, hidden } = await searchParams

  return (
    <AccountShell role="admin" eyebrow="Администрация" title={data.name}>
      <CategoryForm
        id={data.id}
        name={data.name}
        slug={data.slug}
        description={data.description ?? ""}
        sortOrder={data.sort_order}
        isPublished={data.is_published}
        colorAccent={data.color_accent ?? ""}
        coverImageUrl={data.cover_image_url ?? ""}
        saved={saved === "1"}
        hidden={hidden === "1"}
      />
    </AccountShell>
  )
}
