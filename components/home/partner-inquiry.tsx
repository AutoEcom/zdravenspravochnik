"use client"

import { useId, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 py-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"

const budgets = ["до 200 €", "200–500 €", "500+ €", "Ще уточним"]

export function PartnerInquiry({ appearance = "button" }: { appearance?: "button" | "text" }) {
  const formId = useId()
  const [open, setOpen] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const phone = String(data.get("phone") ?? "").trim()
    const email = String(data.get("email") ?? "").trim()
    const organization = String(data.get("organization") ?? "").trim()
    const budget = String(data.get("budget") ?? "").trim()
    const message = String(data.get("message") ?? "").trim()
    if (!name || !phone || !email) return

    const payload = { name, phone, email, organization, budget, message }
    console.info("partner-inquiry", payload)
    const body = [
      `Име: ${name}`,
      `Телефон: ${phone}`,
      `Имейл: ${email}`,
      organization ? `Организация / сайт: ${organization}` : "",
      budget ? `Бюджет: ${budget}` : "",
      message ? `Съобщение: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n")
    window.location.href = `mailto:hello@zdravenspravochnik.bg?subject=${encodeURIComponent("Партньорско запитване")}&body=${encodeURIComponent(body)}`
    toast.success("Получихме запитването")
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className={
          appearance === "text"
            ? "inline cursor-pointer font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            : buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })
        }
        onClick={() => setOpen(true)}
      >
        Станете партньор
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Станете партньор</DialogTitle>
            <DialogDescription>Разкажете накратко за проекта. Отговаряме обикновено до 1 работен ден.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-name`}>Име</Label>
              <Input id={`${formId}-name`} name="name" required maxLength={120} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-phone`}>Телефон</Label>
              <Input id={`${formId}-phone`} name="phone" type="tel" inputMode="tel" placeholder="+359…" required maxLength={40} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-email`}>Имейл</Label>
              <Input id={`${formId}-email`} name="email" type="email" required maxLength={160} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-org`}>Организация / сайт</Label>
              <Input id={`${formId}-org`} name="organization" maxLength={160} />
            </div>
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
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-message`}>Съобщение</Label>
              <textarea
                id={`${formId}-message`}
                name="message"
                maxLength={2000}
                rows={4}
                placeholder="Статия, банер или пакет"
                className={fieldClass}
              />
            </div>
            <button type="submit" className={buttonVariants({ variant: "primary", className: "w-full" })}>
              Изпрати запитване
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
