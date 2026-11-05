"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, LayoutGrid } from "lucide-react"

import { CategoryIcon } from "@/components/articles/category-icon"
import { articleAccent } from "@/lib/content/article-category"
import type { PublicCategory } from "@/lib/supabase/queries/articles"

const linkClass =
  "rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

export function ReadingMenu({
  categories,
  variant,
}: {
  categories: PublicCategory[]
  variant: "desktop" | "mobile"
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const desktop = variant === "desktop"
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={desktop ? "relative" : undefined}>
      <button
        type="button"
        className={`${linkClass} flex w-full cursor-pointer items-center ${desktop ? "gap-1" : "justify-between"}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        Полезно
        <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <div
          id={panelId}
          className={
            desktop
              ? "glass-strong absolute top-full right-0 z-50 mt-2 w-80 rounded-2xl border border-white/40 p-2 shadow-lg"
              : "grid gap-1 pb-1 pl-2"
          }
          style={desktop ? { backgroundColor: "rgba(255,255,255,0.96)" } : undefined}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false)
          }}
        >
          <Link href="/articles" className={`${linkClass} flex items-center gap-3 font-medium text-foreground`}>
            <span className="inline-flex size-5 items-center justify-center text-primary">
              <LayoutGrid className="size-5" aria-hidden />
            </span>
            Всички теми
          </Link>
          {categories.length > 0 ? (
            <ul className="grid gap-1">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/articles/category/${category.slug}`}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <span
                      className="inline-flex size-5 items-center justify-center"
                      style={{ color: articleAccent(category.color_accent) }}
                    >
                      <CategoryIcon slug={category.slug} />
                    </span>
                    <span className={desktop ? "leading-snug font-medium" : "leading-snug"}>{category.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
