"use client"

import { useState } from "react"

import { LoginForm } from "@/app/(auth)/login/login-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ReviewLogin({ next }: { next: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={() => setOpen(true)}
      >
        Вход
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вход</DialogTitle>
            <DialogDescription>Влезте с Google, за да оставите отзив.</DialogDescription>
          </DialogHeader>
          <LoginForm next={next} />
        </DialogContent>
      </Dialog>
    </>
  )
}
