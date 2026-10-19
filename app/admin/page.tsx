import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm font-medium text-primary">Администрация</p>
      <h1 className="text-3xl font-semibold tracking-tight">Управление на справочника</h1>
      <p className="text-muted-foreground">
        Тук ще се одобряват лекари, заведения и съдържание.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
        Към началото
      </Link>
    </main>
  )
}
