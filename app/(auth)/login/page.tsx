import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>
            Формата валидира данните. Сесията със Supabase идва след като
            попълните ключовете в <code>.env.local</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm />
          <Link href="/" className="text-sm text-primary hover:underline">
            Към началото
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
