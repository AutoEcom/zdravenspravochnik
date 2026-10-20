"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  async function onShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={buttonVariants({ variant: "secondary", className: "w-full" })}
    >
      <Share2 />
      {copied ? "Копирано" : "Сподели"}
    </button>
  )
}
