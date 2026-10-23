export const PAGE_SIZE = 24

export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw)
  if (!Number.isInteger(page) || page < 1 || page > 10000) return 1
  return page
}

export function formatCount(value: number) {
  return String(Math.max(0, Math.floor(value))).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export function withPage(path: string, params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const trimmed = value?.trim()
    if (trimmed) query.set(key, trimmed)
  }
  if (page > 1) query.set("page", String(page))
  const search = query.toString()
  return search ? `${path}?${search}` : path
}

export function pageCount(total: number, size = PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / size))
}
