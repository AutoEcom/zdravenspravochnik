import { formatCount } from "@/lib/content/listing"

export function formatViews(value: number) {
  const count = Math.max(0, Math.floor(value))
  if (count < 10000) return formatCount(count)
  const thousands = count / 1000
  const rounded = thousands >= 100 ? Math.round(thousands) : Math.round(thousands * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",")
  return `${text} хил.`
}
