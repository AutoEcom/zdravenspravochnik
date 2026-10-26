"use client"

import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CoverField({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl)
  const preview = /^https:\/\/\S+$/i.test(url.trim()) ? url.trim() : ""

  return (
    <div className="grid gap-2">
      <Label htmlFor="cover_url">Корица</Label>
      <Input
        id="cover_url"
        name="cover_url"
        type="url"
        inputMode="url"
        value={url}
        maxLength={500}
        placeholder="https://"
        onChange={(event) => setUrl(event.target.value)}
      />
      <p className="text-sm text-muted-foreground">Поставете URL към изображение</p>
      {preview ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-white/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
    </div>
  )
}
