import { GlassCard } from "@/components/ui/glass-card"
import { formatBgDate } from "@/lib/content/present"
import type { Article } from "@/types/database"

export function ArticleView({ article }: { article: Article }) {
  const paragraphs = article.content
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:py-16">
      <p className="text-sm font-medium text-primary">Статия</p>
      <h1>{article.title}</h1>
      {article.excerpt ? <p className="text-lg text-muted-foreground">{article.excerpt}</p> : null}
      {article.published_at ? (
        <p className="text-sm text-muted-foreground">{formatBgDate(article.published_at)}</p>
      ) : null}
      <GlassCard className="flex flex-col gap-4">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </GlassCard>
    </main>
  )
}
