import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const sections = [
  {
    title: "Лекари",
    description: "Профили, специалности и контакт.",
    href: "/dashboard",
  },
  {
    title: "Лечебни заведения",
    description: "Болници, клиники и практики.",
    href: "/dashboard",
  },
  {
    title: "Търсене",
    description: "Филтри по град, специалност и име.",
    href: "/dashboard",
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-6 py-16">
      <div className="flex max-w-2xl flex-col gap-4">
        <Badge variant="secondary" className="w-fit">
          Здравен справочник
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Лекари и лечебни заведения на едно място
        </h1>
        <p className="text-muted-foreground">
          Публичната част, входът, таблото и администрацията са отделени.
          Темата по подразбиране е светла.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/login" className={buttonVariants()}>
            Вход
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            Табло
          </Link>
          <Link href="/admin" className={buttonVariants({ variant: "ghost" })}>
            Админ
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}
