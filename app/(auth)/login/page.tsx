import Link from "next/link"
import { Plus } from "lucide-react"

import { LoginForm } from "@/app/(auth)/login/login-form"
import { GlassCard } from "@/components/ui/glass-card"
import { safeNextPath } from "@/lib/auth/paths"
import { createPageMetadata } from "@/components/seo/page-meta"

export const metadata = createPageMetadata({
  title: "Вход",
  description: "Влезте с Google, имейл линк или парола, за да заявите или редактирате профил.",
  path: "/login",
  index: false,
})

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const next = safeNextPath(params.next) ?? ""

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2.5 focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span aria-hidden className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
            <Plus className="size-5" strokeWidth={2.5} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Здравен
            </span>
            <span className="text-lg font-semibold tracking-tight text-primary">справочник</span>
          </span>
        </Link>
        <GlassCard variant="panel" className="grid gap-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Вход</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              С Google, линк по имейл или парола. След входа отивате към таблото или към заявяване на профил.
            </p>
          </div>
          {params.error === "auth" ? (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              Входът не беше завършен. Опитайте отново.
            </p>
          ) : null}
          <LoginForm next={next} />
          <Link href="/" className="text-sm text-primary hover:underline">
            Към началото
          </Link>
        </GlassCard>
      </div>
    </main>
  )
}
