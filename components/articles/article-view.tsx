import Link from "next/link"

import { ArticleBody } from "@/components/articles/article-body"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { articleCover } from "@/lib/content/slug"
import { formatBgDate } from "@/lib/content/present"
import type { Article } from "@/types/database"

export function ArticleView({ article }: { article: Article }) {
  const cover = articleCover(article)
  const published = article.published_at

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-14">
      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium text-primary">Полезно</p>
          <h1>{article.title}</h1>
          {article.excerpt ? <p className="text-lg text-muted-foreground">{article.excerpt}</p> : null}
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
        ) : (
          <div className="glass-panel flex aspect-video items-end rounded-2xl p-6">
            <p className="text-sm font-medium text-primary">Полезно</p>
          </div>
        )}
        <GlassCard variant="panel">
          <ArticleBody content={article.content} />
        </GlassCard>
        <p className="text-sm text-muted-foreground">
          Материалът е информативен и не замества преглед, диагноза или назначение от лекар.
        </p>
      </article>
      <GlassCard className="flex flex-col gap-4">
        <h2 className="text-xl">Намерете специалист</h2>
        <p className="text-muted-foreground">
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
    </main>
  )
}
