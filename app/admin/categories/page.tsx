import Link from "next/link"
import { redirect } from "next/navigation"

import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { getSessionProfile } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = createPageMetadata({
  title: "Категории",
  description: "Категории за материалите в Полезно.",
  path: "/admin/categories",
  index: false,
})

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>
}) {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect("/login?next=/admin/categories")
  if (profile?.role !== "admin") redirect("/dashboard")

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("article_categories")
    .select("id, name, slug, sort_order, is_published")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  const counts = new Map<string, number>()
  if (data) {
    await Promise.all(
      data.map(async (category) => {
        const { count } = await admin
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("category_id", category.id)
        counts.set(category.id, count ?? 0)
      })
    )
  }

  const { deleted } = await searchParams
  const missing = /article_categories|does not exist|schema cache/i.test(error?.message ?? "")

  return (
    <AccountShell role="admin" eyebrow="Администрация" title="Категории">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link href="/admin/articles" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
          Статии
        </Link>
        <Link href="/admin/categories/new" className={buttonVariants({ variant: "primary", className: "w-full sm:w-auto" })}>
          Нова категория
        </Link>
      </div>
      {deleted === "1" ? <p className="mb-4 text-sm text-primary">Категорията е изтрита.</p> : null}
      {missing ? (
        <GlassCard variant="panel">
          Таблицата още я няма. Пуснете supabase/migrations/007_article_categories.sql в SQL Editor.
        </GlassCard>
      ) : error ? (
        <GlassCard variant="panel">Списъкът не се зареди. Проверете връзката с базата.</GlassCard>
      ) : data && data.length > 0 ? (
        <ul className="grid gap-3">
          {data.map((category) => (
            <li key={category.id}>
              <GlassCard variant="panel" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg">{category.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    /{category.slug} · {counts.get(category.id) ?? 0} статии · ред {category.sort_order} ·{" "}
                    {category.is_published ? "публикувана" : "скрита"}
                  </p>
                </div>
                <Link
                  href={`/admin/categories/${category.id}/edit`}
                  className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
                >
                  Редакция
                </Link>
              </GlassCard>
            </li>
          ))}
        </ul>
      ) : (
        <GlassCard variant="panel">Все още няма категории.</GlassCard>
      )}
    </AccountShell>
  )
}
