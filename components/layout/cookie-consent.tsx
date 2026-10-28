"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { buttonVariants } from "@/components/ui/button"

const storageKey = "zs-cookie-consent"

export function CookieConsent() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    if (stored !== "all" && stored !== "necessary") setOpen(true)
  }, [])

  function choose(value: "all" | "necessary") {
    window.localStorage.setItem(storageKey, value)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[28rem] sm:p-0">
      <div
        role="dialog"
        aria-labelledby="cookie-title"
        className="glass-strong rounded-2xl border border-primary/15 p-4 shadow-lg sm:p-5"
      >
        <p id="cookie-title" className="text-sm font-semibold">
          Бисквитки
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Необходимите бисквитки поддържат сайта. Аналитичните се пазят само ако ги приемете. Повече в{" "}
          <Link href="/biskvitki" className="font-medium text-primary underline-offset-4 hover:underline">
            политиката за бисквитки
          </Link>{" "}
          и{" "}
          <Link
            href="/politika-za-poveritelnost"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            поверителността
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" className={buttonVariants({ variant: "primary", className: "w-full sm:w-auto" })} onClick={() => choose("all")}>
            Приемам
          </button>
          <button type="button" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })} onClick={() => choose("necessary")}>
            Само необходими
          </button>
        </div>
      </div>
    </div>
  )
}
