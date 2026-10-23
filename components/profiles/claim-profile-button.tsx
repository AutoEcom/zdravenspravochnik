"use client"

import { useId, useRef, useState } from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

const tip =
  "Ако сте този специалист или управлявате заведението, заявете профила с вашия имейл и ще можете да редактирате данните."

export function ClaimProfileButton({ href, claimed }: { href: string; claimed: boolean }) {
  const tipId = useId()
  const touched = useRef(false)
  const [open, setOpen] = useState(false)

  if (claimed) {
    return (
      <p className="flex h-11 items-center justify-center rounded-xl border border-white/60 bg-white/40 px-4 text-center text-sm text-muted-foreground">
        Профилът се управлява
      </p>
    )
  }

  return (
    <span className="relative block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => { if (!touched.current) setOpen(false) }}>
      <Link
        href={href}
        aria-describedby={tipId}
        className={buttonVariants({ variant: "outline", className: "w-full" })}
        onPointerDown={(event) => {
          touched.current = event.pointerType === "touch"
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (!touched.current) setOpen(false)
        }}
        onClick={(event) => {
          if (touched.current && !open) {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        Това е мой профил
      </Link>
      {open ? (
        <span
          role="tooltip"
          id={tipId}
          className="absolute bottom-[calc(100%+0.5rem)] left-1/2 z-50 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-left text-xs leading-relaxed text-foreground shadow-lg backdrop-blur-xl"
        >
          {tip}
        </span>
      ) : null}
    </span>
  )
}
