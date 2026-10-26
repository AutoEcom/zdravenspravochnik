import Link from "next/link"

import { LogoMark } from "@/components/layout/logo-mark"
import { SignOutButton } from "@/components/account/sign-out-button"
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
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Здравен справочник">
            <LogoMark className="size-9" />
            <span className="hidden text-sm font-semibold text-primary sm:inline">справочник</span>
          </Link>
          <nav className="ml-auto flex flex-wrap items-center justify-end" aria-label="Профил">
            <Link href="/dashboard" className={linkClass}>
              Табло
            </Link>
            <Link href="/claim" className={linkClass}>
              Заяви
            </Link>
            {role === "admin" ? (
              <Link href="/admin" className={linkClass}>
                Клеймове
              </Link>
            ) : null}
            {role === "admin" ? (
              <Link href="/admin/profiles" className={linkClass}>
                Профили
              </Link>
            ) : null}
            {role === "admin" ? (
              <Link href="/admin/articles" className={linkClass}>
                Статии
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
