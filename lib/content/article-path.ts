export function isLegacyArticle(source: string | null | undefined) {
  return !source || source === "legacy_wp"
}

export function articlePublicPath(article: { slug: string; source?: string | null }) {
  return isLegacyArticle(article.source) ? `/${article.slug}` : `/articles/${article.slug}`
}
