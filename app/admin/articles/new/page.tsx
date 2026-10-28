import { redirect } from "next/navigation"

import { ArticleForm } from "@/app/admin/articles/article-form"
import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getSessionProfile } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = createPageMetadata({
  title: "Нова статия",
  description: "Създаване на статия.",
  path: "/admin/articles/new",
  index: false,
})

export default async function NewArticlePage() {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect("/login?next=/admin/articles/new")
  if (profile?.role !== "admin") redirect("/dashboard")

  const admin = createAdminClient()
  const { data: categories } = await admin
    .from("article_categories")
    .select("id, name, is_published, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  return (
    <AccountShell role="admin" eyebrow="Администрация" title="Нова статия">
      <ArticleForm
        title=""
        slug=""
        excerpt=""
        content=""
        status="draft"
        coverImageUrl=""
        metaTitle=""
        metaDescription=""
        ogImageUrl=""
        categoryId=""
        categories={categories ?? []}
      />
    </AccountShell>
  )
}
