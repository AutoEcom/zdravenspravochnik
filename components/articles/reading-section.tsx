import Link from "next/link"

import { ArticleCard } from "@/components/articles/article-card"
import { buttonVariants } from "@/components/ui/button"
import { articleAccent, articlesInTopic, categoriesLabel, publishedArticlesLabel } from "@/lib/content/article-category"
import type { ReadingDigest } from "@/lib/supabase/queries/articles"

export function ReadingSection({ digest }: { digest: ReadingDigest }) {
  return (
    <section
      id="statii"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 pb-20 sm:py-16"
      aria-labelledby="articles-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 id="articles-heading">Полезно</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Кратки материали, които помагат да се ориентирате преди преглед. Те не заместват консултация с лекар.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {publishedArticlesLabel(digest.articleCount)} · {categoriesLabel(digest.categoryCount)}
          </p>
        </div>
        <Link href="/articles" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
          Виж всички
        </Link>
      </div>

      {digest.groups.length > 0 ? (
        <div className="grid gap-10 lg:grid-cols-2">
          {digest.groups.map((group) => {
            const accent = articleAccent(group.category.color_accent)
            return (
              <div key={group.category.id} className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 border-t-2 pt-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: accent }}>
                  <div>
                    <h3>{group.category.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{articlesInTopic(group.total)}</p>
                  </div>
                  <Link
                    href={`/articles/category/${group.category.slug}`}
                    className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Виж всички
                  </Link>
                </div>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {group.articles.map((article) => (
                    <li key={article.id}>
                      <ArticleCard article={article} category={group.category} titleAs="p" />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      ) : digest.latest.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-3">
          {digest.latest.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} titleAs="p" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Публикуваните материали ще се появят тук.</p>
      )}
    </section>
  )
}
