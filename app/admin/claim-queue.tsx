"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { reviewClaim } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { formatBgDate } from "@/lib/content/present"

export function ClaimQueue({
  items,
}: {
  items: {
    id: string
    email: string
    targetType: "doctor" | "facility"
    targetLabel: string
    emailVerified: boolean
    createdAt: string
  }[]
}) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function decide(id: string, decision: "approved" | "rejected") {
    setPendingId(id)
    const result = await reviewClaim(id, decision)
    setPendingId(null)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success(result.message)
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <GlassCard variant="panel">
        <p className="text-sm text-muted-foreground">Няма чакащи заявки.</p>
      </GlassCard>
    )
  }

  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <GlassCard variant="panel" className="grid gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                {item.targetType === "doctor" ? "Лекар" : "Заведение"}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{item.targetLabel}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatBgDate(item.createdAt)} · {item.emailVerified ? "имейлът е потвърден" : "имейлът още не е потвърден"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" disabled={pendingId === item.id} onClick={() => decide(item.id, "approved")}>
                Одобри
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pendingId === item.id}
                onClick={() => decide(item.id, "rejected")}
              >
                Отхвърли
              </Button>
            </div>
          </GlassCard>
        </li>
      ))}
    </ul>
  )
}
