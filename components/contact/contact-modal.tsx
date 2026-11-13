"use client"

import { useState } from "react"

import { ContactForm } from "@/components/contact/contact-form"
import { buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ContactKind } from "@/lib/contact/send"

const copy: Record<ContactKind, { title: string; description: string; trigger: string }> = {
  partner: {
    title: "Станете партньор",
    description: "Разкажете накратко за проекта. Отговаряме обикновено до 1 работен ден.",
    trigger: "Станете партньор",
  },
  general: {
    title: "Свържете се с нас",
    description: "Напишете накратко въпроса. Отговаряме обикновено до 1 работен ден.",
    trigger: "Свържете се с нас",
  },
  about: {
    title: "Свържете се с нас",
    description: "Разкажете накратко с какво можем да помогнем. Отговаряме обикновено до 1 работен ден.",
    trigger: "Свържете се с нас",
  },
}

export function ContactModal({
  kind,
  appearance = "button",
  label,
}: {
  kind: ContactKind
  appearance?: "button" | "text"
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const content = copy[kind]

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
        {label ?? content.trigger}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{content.title}</DialogTitle>
            <DialogDescription>{content.description}</DialogDescription>
          </DialogHeader>
          <ContactForm kind={kind} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
