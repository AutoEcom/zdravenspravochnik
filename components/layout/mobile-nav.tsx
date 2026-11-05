"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
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
    <div ref={rootRef} className="relative lg:hidden">
      <button
        type="button"
        className="flex size-11 cursor-pointer items-center justify-center rounded-xl transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-expanded={open}
        aria-label="Меню"
        onClick={() => setOpen((current) => !current)}
      >
        <Menu className="size-5" />
      </button>
      {open ? (
        <nav
          className="glass-strong absolute right-0 z-50 mt-2 grid max-h-[70vh] w-72 gap-1 overflow-y-auto rounded-2xl border border-white/40 p-2 shadow-lg"
          style={{ backgroundColor: "rgba(255,255,255,0.96)" }}
          aria-label="Мобилна"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false)
          }}
          onSubmit={() => setOpen(false)}
        >
          {children}
        </nav>
      ) : null}
    </div>
  )
}
