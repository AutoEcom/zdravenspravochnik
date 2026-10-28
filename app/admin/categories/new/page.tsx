import { redirect } from "next/navigation"

import { CategoryForm } from "@/app/admin/categories/category-form"
import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getSessionProfile } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = createPageMetadata({
  title: "Нова категория",
  description: "Създаване на категория за Полезно.",
  path: "/admin/categories/new",
  index: false,
})

export default async function NewCategoryPage() {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect("/login?next=/admin/categories/new")
  if (profile?.role !== "admin") redirect("/dashboard")

  const admin = createAdminClient()
  const { data } = await admin.from("article_categories").select("sort_order").order("sort_order", { ascending: false }).limit(1)
  const nextOrder = (data?.[0]?.sort_order ?? 0) + 1

  return (
    <AccountShell role="admin" eyebrow="Администрация" title="Нова категория">
      <CategoryForm
        name=""
        slug=""
        description=""
        sortOrder={nextOrder}
        isPublished
        colorAccent="#0F766E"
        coverImageUrl=""
      />
    </AccountShell>
  )
}
