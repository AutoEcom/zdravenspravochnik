import type { ReactNode } from "react"
import Link from "next/link"

export function FillIn({ label }: { label: string }) {
  return (
    <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-foreground">[ПОПЪЛНИ: {label}]</span>
  )
}

export function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-primary">Правна информация</p>
      <h1 className="mt-3">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Последна актуализация: {updated}</p>
      <div className="mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a]:hover:underline [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        <Link href="/">Към началото</Link>
      </p>
    </main>
  )
}
