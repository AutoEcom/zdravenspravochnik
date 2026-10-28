import Link from "next/link"

import { AdSlot } from "@/components/articles/ad-slot"
import { ArticleBody } from "@/components/articles/article-body"
import { ArticleBreadcrumb } from "@/components/articles/article-breadcrumb"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { articleAccent } from "@/lib/content/article-category"
import { articlePublicPath } from "@/lib/content/article-path"
import { articleCover } from "@/lib/content/slug"
import { formatBgDate } from "@/lib/content/present"
import type { PublicCategory, RelatedArticle } from "@/lib/supabase/queries/articles"
import type { Article } from "@/types/database"

export function ArticleView({
  article,
  category = null,
  related = [],
}: {
  article: Article
  category?: PublicCategory | null
  related?: RelatedArticle[]
}) {
  const cover = articleCover(article)
  const published = article.published_at
  const accent = articleAccent(category?.color_accent)

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-8">
        <article className="flex flex-col gap-6">
          <header className="flex max-w-[72ch] flex-col gap-3">
            <ArticleBreadcrumb
              items={[
                { name: "Начало", href: "/" },
                { name: "Полезно", href: "/articles" },
                ...(category ? [{ name: category.name, href: `/articles/category/${category.slug}` }] : []),
                { name: article.title },
              ]}
            />
            {category ? (
              <Link
                href={`/articles/category/${category.slug}`}
                className="inline-flex min-h-11 w-fit items-center rounded-full border bg-white/80 px-3 text-sm font-medium"
                style={{ borderColor: accent, color: accent }}
              >
                {category.name}
              </Link>
            ) : (
              <p className="text-sm font-medium text-primary">Полезно</p>
            )}
            <h1 className="border-t-2 pt-4" style={{ borderColor: accent }}>
              {article.title}
            </h1>
            {article.excerpt ? <p className="text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p> : null}
            {published ? (
              <time dateTime={published} className="text-sm text-muted-foreground">
                {formatBgDate(published)}
              </time>
            ) : null}
          </header>
          {cover ? (
            <div className="aspect-video overflow-hidden rounded-2xl bg-white/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt={article.title} className="h-full w-full object-cover" />
            </div>
          ) : null}
          <GlassCard variant="panel">
            <ArticleBody content={article.content} />
          </GlassCard>
          <p className="text-sm text-muted-foreground">
            Материалът е информативен и не замества преглед, диагноза или назначение от лекар.
          </p>
        </article>
        <GlassCard className="flex flex-col gap-4">
          <h2 className="text-xl">Намерете специалист</h2>
          <p className="leading-relaxed text-muted-foreground">
            Ако текстът ви насочи към преглед, отворете публикуваните лекари или търсете по специалност и град.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/specialisti" className={buttonVariants({ variant: "primary", className: "w-full sm:w-auto" })}>
              Намерете специалист
            </Link>
            <Link href="/search" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
              Търсене
            </Link>
          </div>
        </GlassCard>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        {related.length > 0 ? (
          <GlassCard variant="panel" className="flex flex-col gap-4">
            <h2 className="text-lg">Още от Полезно</h2>
            <ul className="grid gap-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link href={articlePublicPath(item)} className="flex min-h-11 items-center gap-3">
                    {item.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.cover} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="glass flex h-14 w-20 shrink-0 items-center justify-center rounded-xl text-[11px] text-primary">
                        Полезно
                      </span>
                    )}
                    <span className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </GlassCard>
        ) : null}
        <GlassCard variant="panel" className="flex flex-col gap-3">
          <h2 className="text-lg">Намерете лекар</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">Специалност и град, после директен профил.</p>
          <Link href="/specialisti" className={buttonVariants({ variant: "primary", className: "w-full" })}>
            Към специалистите
          </Link>
        </GlassCard>
        <AdSlot />
      </div>
    </main>
  )
}
