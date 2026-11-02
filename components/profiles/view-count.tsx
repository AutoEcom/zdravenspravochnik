"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"

import { formatViews } from "@/lib/content/views"
import { formatCount } from "@/lib/content/listing"

export function ViewCount({
  type,
  id,
  count,
}: {
  type: "doctor" | "facility" | "article"
  id: string
  count: number
}) {
  const [shown, setShown] = useState(count)

  useEffect(() => {
    let active = true
    fetch("/api/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, id }),
    })
      .then((response) => response.json())
      .then((data: { counted?: boolean }) => {
        if (active && data.counted) setShown(count + 1)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [type, id, count])

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground" title={`${formatCount(shown)} прегледа`}>
      <Eye className="size-4" aria-hidden />
      <span className="tabular-nums">{formatViews(shown)}</span>
    </span>
  )
}
