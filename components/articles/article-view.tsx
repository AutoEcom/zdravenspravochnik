import Link from "next/link"

import { ArticleBody } from "@/components/articles/article-body"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { articleCover } from "@/lib/content/slug"
import { formatBgDate } from "@/lib/content/present"
import type { RelatedArticle } from "@/lib/supabase/queries/articles"
import type { Article } from "@/types/database"

export function ArticleView({ article, related = [] }: { article: Article; related?: RelatedArticle[] }) {
  const cover = articleCover(article)
  const published = article.published_at

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-8">
        <article className="flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            <p className="text-sm font-medium text-primary">Полезно</p>
            <h1>{article.title}</h1>
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
                  <Link href={`/articles/${encodeURIComponent(item.slug)}`} className="flex items-center gap-3">
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
        <aside
          aria-label="Реклама"
          className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-white/40 p-6"
        >
          <p className="text-sm text-muted-foreground">Реклама</p>
        </aside>
      </div>
    </main>
  )
}
