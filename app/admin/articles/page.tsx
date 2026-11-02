import Link from "next/link"
import { redirect } from "next/navigation"

import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { ListingPagination } from "@/components/search/listing-pagination"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { getSessionProfile } from "@/lib/auth/session"
import { parsePage } from "@/lib/content/listing"
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

const PAGE_SIZE = 20

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>
}

function searchTerm(value: string | undefined) {
  return (value ?? "").replace(/[%_,().*"'\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)
}

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const query = searchTerm(params.q)
  const page = parsePage(params.page)
  const { user, profile } = await getSessionProfile()
  if (!user) redirect(`/login?next=${encodeURIComponent(query ? `/admin/articles?q=${query}` : "/admin/articles")}`)
  if (profile?.role !== "admin") redirect("/dashboard")

  const admin = createAdminClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  let request = admin
    .from("articles")
    .select("id, title, slug, status, published_at, updated_at, category_id", { count: "exact" })
    .order("updated_at", { ascending: false })
  if (query) {
    request = request.or(`title.ilike.%${query}%,slug.ilike.%${query}%,excerpt.ilike.%${query}%`)
  }
  const [listed, categories] = await Promise.all([
    request.range(from, to),
    admin.from("article_categories").select("id, name"),
  ])
  const fallbackQuery = admin
    .from("articles")
    .select("id, title, slug, status, published_at, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
  const fallback =
    listed.error && /category_id/i.test(listed.error.message)
      ? await (query
          ? fallbackQuery.or(`title.ilike.%${query}%,slug.ilike.%${query}%,excerpt.ilike.%${query}%`)
          : fallbackQuery
        ).range(from, to)
      : null
  const result = fallback ?? listed
  const data = (result.data ?? []).map((article) => {
    const raw = "category_id" in article ? article.category_id : null
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      status: article.status,
      published_at: article.published_at,
      updated_at: article.updated_at,
      category_id: typeof raw === "string" ? raw : null,
    }
  })
  const total = result.count ?? 0
  const error = result.error
  const categoryName = new Map((categories.data ?? []).map((category) => [category.id, category.name]))

  return (
    <AccountShell role="admin" eyebrow="Администрация" title="Статии">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form action="/admin/articles" className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
          <label className="sr-only" htmlFor="article-query">
            Търсене
          </label>
          <Input id="article-query" name="q" defaultValue={query} placeholder="Заглавие, адрес или описание" />
          <button type="submit" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
            Търси
          </button>
          {query ? (
            <Link href="/admin/articles" className={buttonVariants({ variant: "ghost", className: "w-full sm:w-auto" })}>
              Изчисти
            </Link>
          ) : null}
        </form>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/admin/categories" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
            Категории
          </Link>
          <Link href="/admin/articles/new" className={buttonVariants({ variant: "primary", className: "w-full sm:w-auto" })}>
            Нова статия
          </Link>
        </div>
      </div>
      {error ? (
        <GlassCard variant="panel">Списъкът не се зареди. Проверете връзката с базата.</GlassCard>
      ) : data.length > 0 ? (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {query ? `„${query}“ · ` : ""}
            {total} {total === 1 ? "статия" : "статии"}
          </p>
          <ul className="grid gap-3">
            {data.map((article) => {
              const when = article.published_at || article.updated_at
              return (
                <li key={article.id}>
                  <GlassCard variant="panel" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg">{article.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[article.slug, article.category_id ? categoryName.get(article.category_id) : null, statusLabel[article.status], when ? formatBgDate(when) : null]
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
          <div className="mt-4">
            <ListingPagination page={page} total={total} path="/admin/articles" params={{ q: query || undefined }} pageSize={PAGE_SIZE} />
          </div>
        </>
      ) : (
        <GlassCard variant="panel">{query ? "Няма статия с този текст." : "Все още няма статии."}</GlassCard>
      )}
    </AccountShell>
  )
}
