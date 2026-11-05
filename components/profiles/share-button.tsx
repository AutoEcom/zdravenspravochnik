"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { shareUrl as canonicalShareUrl } from "@/lib/site"
import { cn } from "cn"

export function ShareButton({ title, url, className }: { title: string; url: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function onShare() {
    const target = canonicalShareUrl(url)
    try {
      if (navigator.share) {
        await navigator.share({ title, url: target })
        return
      }
      await navigator.clipboard.writeText(target)
      setCopied(true)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      try {
        await navigator.clipboard.writeText(target)
        setCopied(true)
      } catch {
        setCopied(false)
      }
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={cn(buttonVariants({ variant: "secondary" }), "w-full", className)}
    >
      <Share2 />
      {copied ? "Копирано" : "Сподели"}
    </button>
  )
}
