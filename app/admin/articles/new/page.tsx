import { redirect } from "next/navigation"

import { ArticleForm } from "@/app/admin/articles/article-form"
import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getSessionProfile } from "@/lib/auth/session"

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
      />
    </AccountShell>
  )
}
