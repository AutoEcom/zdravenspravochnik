"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const schema = z
  .object({
    email: z.email("Въведете валиден имейл."),
    password: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.password.length > 0 && value.password.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Паролата трябва да е поне 8 символа.",
      })
    }
  })

type LoginValues = z.infer<typeof schema>
type Mode = "password" | "magic" | "signup"

const modes: { id: Mode; label: string }[] = [
  { id: "password", label: "Парола" },
  { id: "magic", label: "Линк" },
  { id: "signup", label: "Регистрация" },
]

function authMessage(error: { message: string }) {
  const text = error.message.toLowerCase()
  if (text.includes("invalid login")) return "Грешен имейл или парола."
  if (text.includes("email not confirmed")) return "Потвърдете имейла си преди вход."
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "Вече има профил с този имейл. Влезте с парола."
  }
  return "Входът не успя. Проверете данните и опитайте отново."
}

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("password")
  const [googlePending, setGooglePending] = useState(false)
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    if (mode !== "magic" && values.password.length < 8) {
      form.setError("password", { message: "Паролата трябва да е поне 8 символа." })
      return
    }

    const supabase = createClient()
    const origin = window.location.origin
    const continuePath = next ? `/auth/continue?next=${encodeURIComponent(next)}` : "/auth/continue"
    const emailRedirectTo = `${origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: { emailRedirectTo },
      })
      if (error) {
        toast.error(authMessage(error))
        return
      }
      toast.success("Изпратихме линк за вход. Отворете го от пощата си.")
      return
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo },
      })
      if (error) {
        toast.error(authMessage(error))
        return
      }
      if (data.session) {
        window.location.assign(continuePath)
        return
      }
      toast.success("Профилът е създаден. Ако има писмо за потвърждение, отворете линка в него.")
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      toast.error(authMessage(error))
      return
    }
    window.location.assign(continuePath)
  }

  async function signInWithGoogle() {
    setGooglePending(true)
    const supabase = createClient()
    const emailRedirectTo = `${window.location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: emailRedirectTo },
    })
    if (error) {
      setGooglePending(false)
      toast.error("Google входът не стартира. Проверете дали е включен в Supabase.")
    }
  }

  return (
    <div className="grid gap-4">
      <Button type="button" variant="outline" className="w-full" disabled={googlePending} onClick={signInWithGoogle}>
        <GoogleMark />
        Вход с Google
      </Button>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100/80 p-1">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`h-9 rounded-lg text-sm font-medium transition-colors ${
              mode === item.id ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Имейл</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="ime@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {mode === "magic" ? (
            <p className="text-sm text-muted-foreground">Ще получите линк за вход на този имейл.</p>
          ) : (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Парола</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {mode === "magic" ? "Изпрати линк" : mode === "signup" ? "Създай профил" : "Вход"}
          </Button>
        </form>
      </Form>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2.2 12 2.2 6.8 2.2 2.6 6.4 2.6 11.6S6.8 21 12 21c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  )
}
