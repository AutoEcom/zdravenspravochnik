"use client"

import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"

type ProfileSuggestion = {
  kind: "doctor" | "facility"
  slug: string
  name: string
  detail: string
}

const fieldClass =
  "h-11 w-full rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 text-base text-foreground outline-none transition-colors duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 md:text-sm"

type Box = { top: number; left: number; width: number }

export function SearchQueryField({
  id,
  defaultValue = "",
  placeholder = "Име на лекар или заведение",
  inputClassName,
}: {
  id: string
  defaultValue?: string
  placeholder?: string
  inputClassName?: string
}) {
  const router = useRouter()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)
  const [items, setItems] = useState<ProfileSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [box, setBox] = useState<Box | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    const query = value.trim()
    if (query.length < 3) {
      setItems([])
      setOpen(false)
      setActive(-1)
      return
    }

    const current = ++requestId.current
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`)
        if (!response.ok) return
        const payload = (await response.json()) as { suggestions?: ProfileSuggestion[] }
        if (current !== requestId.current) return
        const suggestions = payload.suggestions ?? []
        setItems(suggestions)
        setOpen(suggestions.length > 0)
        setActive(-1)
      } catch {
        if (current === requestId.current) {
          setItems([])
          setOpen(false)
        }
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [value])

  useEffect(() => {
    if (!open) return
    function place() {
      const rect = inputRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(rect.width, window.innerWidth - 16)
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
      setBox({ top: rect.bottom + 8, left, width })
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [open, items.length])

  function openProfile(item: ProfileSuggestion) {
    setOpen(false)
    router.push(`/${item.slug}`)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActive((current) => (current + 1) % items.length)
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((current) => (current <= 0 ? items.length - 1 : current - 1))
      return
    }
    if (event.key === "Escape") {
      setOpen(false)
      setActive(-1)
      return
    }
    if (event.key === "Enter" && active >= 0) {
      event.preventDefault()
      const item = items[active]
      if (item) openProfile(item)
    }
  }

  const activeId = active >= 0 ? `${listId}-${active}` : undefined
  const list =
    open && box && typeof document !== "undefined"
      ? createPortal(
          <ul
            id={listId}
            role="listbox"
            style={{ top: box.top, left: box.left, width: box.width }}
            className="glass-strong fixed z-[90] grid max-h-80 overflow-auto rounded-2xl p-1.5 shadow-xl"
          >
            {items.map((item, index) => (
              <li key={`${item.kind}-${item.slug}`} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  className={`flex min-h-11 w-full flex-col items-start justify-center rounded-xl px-3 py-2 text-left ${
                    index === active ? "bg-primary/10" : "hover:bg-primary/5"
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => openProfile(item)}
                >
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.detail}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )
      : null

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        name="q"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeId}
        value={value}
        autoComplete="off"
        enterKeyHint="search"
        placeholder={placeholder}
        className={inputClassName ?? fieldClass}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => {
          if (items.length > 0) setOpen(true)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      />
      {list}
    </div>
  )
}
