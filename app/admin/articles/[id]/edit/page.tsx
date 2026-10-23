import { notFound, redirect } from "next/navigation"

import { ArticleForm } from "@/app/admin/articles/article-form"
import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getSessionProfile } from "@/lib/auth/session"
import { articleCover } from "@/lib/content/slug"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = createPageMetadata({
  title: "Редакция на статия",
  description: "Редакция и публикуване на статия.",
  path: "/admin/articles",
  index: false,
})

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect("/login?next=/admin/articles")
  if (profile?.role !== "admin") redirect("/dashboard")

  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const admin = createAdminClient()
  const { data } = await admin.from("articles").select("*").eq("id", id).maybeSingle()
  if (!data) notFound()

  const { saved } = await searchParams
  const status = data.status === "published" ? "published" : "draft"

  return (
    <AccountShell role="admin" eyebrow="Администрация" title={data.title}>
      <ArticleForm
        id={data.id}
        title={data.title}
        slug={data.slug}
        excerpt={data.excerpt ?? ""}
        content={data.content}
        status={status}
        coverImageUrl={articleCover(data) ?? ""}
        metaTitle={data.meta_title ?? ""}
        metaDescription={data.meta_description ?? ""}
        ogImageUrl={data.og_image_url ?? ""}
        saved={saved === "1"}
      />
    </AccountShell>
  )
}
