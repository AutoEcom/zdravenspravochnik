"use client"

import { useId, useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"

import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitContact } from "@/lib/contact/actions"
import type { ContactKind } from "@/lib/contact/send"

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 py-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"

const budgets = ["до 200 €", "200–500 €", "500+ €", "Ще уточним"]

export function ContactForm({ kind, onDone }: { kind: ContactKind; onDone?: () => void }) {
  const formId = useId()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const partner = kind === "partner"

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setError("")
    startTransition(async () => {
      const result = await submitContact({
        kind,
        name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        email: String(data.get("email") ?? ""),
        organization: String(data.get("organization") ?? ""),
        budget: String(data.get("budget") ?? ""),
        message: String(data.get("message") ?? ""),
        company: String(data.get("company") ?? ""),
      })
      if (!result.ok) {
        setError(result.error)
        toast.error(result.error)
        return
      }
      form.reset()
      toast.success(partner ? "Получихме запитването" : "Получихме съобщението")
      onDone?.()
    })
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="sr-only" aria-hidden>
        <label htmlFor={`${formId}-company`}>Компания</label>
        <input id={`${formId}-company`} name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${formId}-name`}>Име *</Label>
        <Input id={`${formId}-name`} name="name" required maxLength={120} autoComplete="name" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${formId}-phone`}>Телефон *</Label>
        <Input
          id={`${formId}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="+359…"
          required
          maxLength={40}
          autoComplete="tel"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${formId}-email`}>Имейл *</Label>
        <Input id={`${formId}-email`} name="email" type="email" required maxLength={160} autoComplete="email" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${formId}-org`}>{partner ? "Организация / сайт" : "Организация"}</Label>
        <Input id={`${formId}-org`} name="organization" maxLength={160} autoComplete="organization" />
      </div>
      {partner ? (
        <div className="grid gap-2">
          <Label htmlFor={`${formId}-budget`}>Бюджет</Label>
          <select id={`${formId}-budget`} name="budget" defaultValue="" className={fieldClass}>
            <option value="">По избор</option>
            {budgets.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor={`${formId}-message`}>Съобщение{partner ? "" : " *"}</Label>
        <textarea
          id={`${formId}-message`}
          name="message"
          required={!partner}
          maxLength={2000}
          rows={4}
          placeholder={partner ? "Статия, банер или пакет" : "Вашият въпрос"}
          className={fieldClass}
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className={buttonVariants({ variant: "primary", className: "w-full" })}>
        {pending ? "Изпращане…" : partner ? "Изпрати запитване" : "Изпрати съобщение"}
      </button>
    </form>
  )
}
