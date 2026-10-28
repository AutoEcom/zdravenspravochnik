import Link from "next/link"
import { redirect } from "next/navigation"

import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { getSessionProfile } from "@/lib/auth/session"
import { formatBgDate } from "@/lib/content/present"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = createPageMetadata({
  title: "Статии",
  description: "Списък със статии за публикуване.",
  path: "/admin/articles",
  index: false,
})

const statusLabel = {
  draft: "Чернова",
  published: "Публикувана",
  archived: "Архив",
} as const

export default async function AdminArticlesPage() {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect("/login?next=/admin/articles")
  if (profile?.role !== "admin") redirect("/dashboard")

  const admin = createAdminClient()
  const [withCategory, categories] = await Promise.all([
    admin.from("articles").select("id, title, status, published_at, updated_at, category_id").order("updated_at", { ascending: false }),
    admin.from("article_categories").select("id, name"),
  ])
  const listed =
    withCategory.error && /category_id/i.test(withCategory.error.message)
      ? await admin.from("articles").select("id, title, status, published_at, updated_at").order("updated_at", { ascending: false })
      : withCategory
  const data = (listed.data ?? []).map((article) => {
    const raw = "category_id" in article ? article.category_id : null
    return {
      id: article.id,
      title: article.title,
      status: article.status,
      published_at: article.published_at,
      updated_at: article.updated_at,
      category_id: typeof raw === "string" ? raw : null,
    }
  })
  const error = listed.error
  const categoryName = new Map((categories.data ?? []).map((category) => [category.id, category.name]))

  return (
    <AccountShell role="admin" eyebrow="Администрация" title="Статии">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link href="/admin/categories" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
          Категории
        </Link>
        <Link href="/admin/articles/new" className={buttonVariants({ variant: "primary", className: "w-full sm:w-auto" })}>
          Нова статия
        </Link>
      </div>
      {error ? (
        <GlassCard variant="panel">Списъкът не се зареди. Проверете връзката с базата.</GlassCard>
      ) : data && data.length > 0 ? (
        <ul className="grid gap-3">
          {data.map((article) => {
            const when = article.published_at || article.updated_at
            return (
              <li key={article.id}>
                <GlassCard variant="panel" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg">{article.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[article.category_id ? categoryName.get(article.category_id) : null, statusLabel[article.status], when ? formatBgDate(when) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
                  >
                    Редакция
                  </Link>
                </GlassCard>
              </li>
            )
          })}
        </ul>
      ) : (
        <GlassCard variant="panel">Все още няма статии.</GlassCard>
      )}
    </AccountShell>
  )
}
