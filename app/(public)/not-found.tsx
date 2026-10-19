import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Страницата не е намерена",
  robots: { index: false, follow: true },
}

export default function PublicNotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col justify-center gap-4 px-4 py-16">
      <p className="text-sm font-medium text-primary">404</p>
      <h1>Страницата не е намерена</h1>
      <p className="text-muted-foreground">
        Профилът не е публикуван или адресът вече не съществува.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          Към началото
        </Link>
        <Link href="/search" className={buttonVariants({ variant: "outline" })}>
          Търсене
        </Link>
      </div>
    </main>
  )
}
