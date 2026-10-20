import Link from "next/link"
import { Plus } from "lucide-react"

import { SignOutButton } from "@/components/account/sign-out-button"
import { canOpenDashboard } from "@/lib/auth/roles"
import type { UserRole } from "@/types/database"

const linkClass =
  "rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"

export function AccountShell({
  role,
  eyebrow,
  title,
  children,
}: {
  role: UserRole
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-40">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Начало">
            <span aria-hidden className="flex size-8 items-center justify-center rounded-xl bg-primary text-white">
              <Plus className="size-4" strokeWidth={2.5} />
            </span>
            <span className="hidden text-sm font-semibold text-primary sm:inline">справочник</span>
          </Link>
          <nav className="ml-auto flex items-center" aria-label="Профил">
            <Link href="/claim" className={linkClass}>
              Заяви
            </Link>
            {canOpenDashboard(role) ? (
              <Link href="/dashboard" className={linkClass}>
                Табло
              </Link>
            ) : null}
            {role === "admin" ? (
              <Link href="/admin" className={linkClass}>
                Админ
              </Link>
            ) : null}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  )
}
