"use client"

import { useEffect, useState } from "react"

const storageKey = "zs-listing-hint"

export function ListingHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window.localStorage.getItem(storageKey) !== "1") setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <p className="flex items-start justify-between gap-3 rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      <span>
        Филтрирайте по специалност и град. Специалистите могат да заявят профила си с бутона „Това е мой профил“.
      </span>
      <button
        type="button"
        className="shrink-0 rounded-lg px-2 py-1 text-foreground/70 transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={() => {
          window.localStorage.setItem(storageKey, "1")
          setVisible(false)
        }}
      >
        Затвори
      </button>
    </p>
  )
}
