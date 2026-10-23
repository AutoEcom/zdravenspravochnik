"use client"

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"

const accepted = ["image/jpeg", "image/png", "image/webp"]

async function compress(file: File) {
  if (!accepted.includes(file.type)) {
    throw new Error("Приемат се само JPEG, PNG и WebP.")
  }
  if (file.size > 5 * 1024 * 1024 && file.type === "image/gif") {
    throw new Error("Файлът е по-голям от 5 MB.")
  }
  const bitmap = await createImageBitmap(file)
  const max = 1600
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext("2d")
  if (!context) return file
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const type = file.type === "image/png" ? "image/png" : "image/webp"
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82))
  if (!blob) return file
  if (blob.size > 5 * 1024 * 1024) throw new Error("След оразмеряване файлът пак е над 5 MB.")
  const name = file.name.replace(/\.\w+$/, type === "image/png" ? ".png" : ".webp")
  return new File([blob], name, { type })
}

export function CoverField({ initialUrl }: { initialUrl: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(initialUrl)
  const [removed, setRemoved] = useState(false)
  const [error, setError] = useState("")

  async function applyFile(file: File | null) {
    setError("")
    if (!file) return
    try {
      const next = await compress(file)
      const transfer = new DataTransfer()
      transfer.items.add(next)
      if (inputRef.current) inputRef.current.files = transfer.files
      setPreview(URL.createObjectURL(next))
      setRemoved(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Снимката не се прочете.")
    }
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = ""
    setPreview("")
    setRemoved(true)
    setError("")
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">Корица</span>
      <input type="hidden" name="remove_cover" value={removed ? "1" : ""} />
      <input type="hidden" name="existing_cover" value={initialUrl} />
      <label
        className="glass flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 px-4 py-6 text-center text-sm text-muted-foreground"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          void applyFile(event.dataTransfer.files[0] ?? null)
        }}
      >
        <input
          ref={inputRef}
          name="cover_file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => void applyFile(event.target.files?.[0] ?? null)}
        />
        Пуснете снимка тук или изберете файл. JPEG, PNG или WebP, до 5 MB.
      </label>
      {preview ? (
        <div className="grid gap-2">
          <div className="aspect-video overflow-hidden rounded-2xl bg-white/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Преглед на корицата" className="h-full w-full object-cover" />
          </div>
          <Button type="button" variant="outline" onClick={clear} className="w-full sm:w-auto">
            Премахни снимката
          </Button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  )
}
