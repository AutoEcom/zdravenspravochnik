"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DialogPreview() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Отвори диалог
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Потвърждение</DialogTitle>
          <DialogDescription>
            Диалогът използва плътно стъкло, мека сянка и видим фокус.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="primary">Продължи</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
