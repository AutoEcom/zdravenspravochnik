"use client"

import { useState } from "react"
import { toast } from "sonner"

import { searchProfiles, submitClaim, verifyClaimCode } from "@/app/claim/actions"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TargetType = "doctor" | "facility"
type ClaimPurpose = "claim" | "review"
type ClaimSearchHit = {
  id: string
  slug: string
  name: string
  meta: string
  claimed: boolean
}

export function ClaimForm({
  initialType = "doctor",
  initialQuery = "",
  initialHit = null,
}: {
  initialType?: TargetType
  initialQuery?: string
  initialHit?: ClaimSearchHit | null
}) {
  const [targetType, setTargetType] = useState<TargetType>(initialType)
  const [query, setQuery] = useState(initialQuery)
  const [hits, setHits] = useState<ClaimSearchHit[]>(initialHit ? [initialHit] : [])
  const [selected, setSelected] = useState<ClaimSearchHit | null>(initialHit && !initialHit.claimed ? initialHit : null)
  const [email, setEmail] = useState("")
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [purpose, setPurpose] = useState<ClaimPurpose | null>(null)
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [pendingNotice, setPendingNotice] = useState(false)

  async function onSearch(event: React.FormEvent) {
    event.preventDefault()
    setSearching(true)
    setSelected(null)
    setRequestId(null)
    setPendingNotice(false)
    const result = await searchProfiles(targetType, query)
    setSearching(false)
    if ("error" in result) {
      setHits([])
      toast.error(result.error)
      return
    }
    setHits(result.hits)
    if (result.hits.length === 0) toast("Няма съвпадения. Опитайте с име или slug.")
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!selected) {
      toast.error("Изберете профил от резултатите.")
      return
    }
    setSubmitting(true)
    const result = await submitClaim({ targetType, targetId: selected.id, email })
    setSubmitting(false)

    if (result.status === "error") {
      toast.error(result.message)
      return
    }
    if (result.status === "owned") {
      toast.success("Вече управлявате този профил.")
      window.location.assign("/dashboard")
      return
    }
    if (result.status === "claimed") {
      toast.success("Профилът е потвърден.")
      window.location.assign("/dashboard")
      return
    }

    setRequestId(result.requestId)
    setPurpose(result.purpose)
    setSimulatedCode(result.simulatedCode ?? null)
    setPendingNotice(false)
    toast.success(result.purpose === "claim" ? "Изпратихме код за потвърждение." : "Изпратихме код. Заявката чака преглед след него.")
  }

  async function onVerify(event: React.FormEvent) {
    event.preventDefault()
    if (!requestId) return
    setSubmitting(true)
    const result = await verifyClaimCode(requestId, code)
    setSubmitting(false)
    if (result.status === "error") {
      toast.error(result.message)
      return
    }
    if (result.status === "claimed") {
      toast.success("Профилът е потвърден.")
      window.location.assign("/dashboard")
      return
    }
    setPendingNotice(true)
    setRequestId(null)
    toast.success("Заявката е изпратена за преглед.")
  }

  return (
    <div className="grid gap-4">
      <GlassCard variant="panel" className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["doctor", "Лекар"],
              ["facility", "Заведение"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`h-11 rounded-xl text-sm font-medium ${
                targetType === value ? "bg-primary text-white" : "bg-white/70 text-foreground"
              }`}
              onClick={() => {
                setTargetType(value)
                setHits([])
                setSelected(null)
                setRequestId(null)
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={onSearch} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="claim-query">Име или slug</Label>
            <Input
              id="claim-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={targetType === "doctor" ? "Миленова или nevrolog-sofia" : "София Център или dkc-sofia"}
            />
          </div>
          <Button type="submit" variant="outline" disabled={searching}>
            Търси
          </Button>
        </form>

        {hits.length > 0 ? (
          <ul className="grid gap-2">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  disabled={hit.claimed}
                  aria-pressed={selected?.id === hit.id}
                  onClick={() => setSelected(hit)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-60 ${
                    selected?.id === hit.id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200/80 bg-white/70"
                  }`}
                >
                  <span className="block font-medium">{hit.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {hit.meta} · {hit.slug}
                    {hit.claimed ? " · вече е потвърден" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </GlassCard>

      <GlassCard variant="panel">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="claim-email">Имейл за верификация</Label>
            <Input
              id="claim-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ime@example.com"
              required
            />
            <p className="text-sm text-muted-foreground">
              Ако съвпада с имейла в профила и с вашия акаунт, потвърждението е веднага. Иначе изпращаме 6-цифрен код.
            </p>
          </div>
          <Button type="submit" disabled={submitting || !selected}>
            Заяви профила
          </Button>
        </form>
      </GlassCard>

      {requestId ? (
        <GlassCard variant="panel">
          <form onSubmit={onVerify} className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold">Код от имейла</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {purpose === "claim"
                  ? "Имейлът съвпада с профила. След верния код той става ваш."
                  : "Имейлът е различен. След кода заявката остава за одобрение от администратор."}
              </p>
            </div>
            {simulatedCode ? (
              <p className="rounded-xl bg-warning/15 px-3 py-2 text-sm text-warning-foreground">
                Няма настроен имейл доставчик. Симулация, код: <strong>{simulatedCode}</strong>
              </p>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="claim-code">6-цифрен код</Label>
              <Input
                id="claim-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </div>
            <Button type="submit" disabled={submitting || code.length !== 6}>
              Потвърди кода
            </Button>
          </form>
        </GlassCard>
      ) : null}

      {pendingNotice ? (
        <GlassCard variant="panel">
          <h2 className="text-lg font-semibold">Заявката е изпратена</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Имейлът не съвпада с този в профила. Администратор ще я одобри или отхвърли.
          </p>
        </GlassCard>
      ) : null}
    </div>
  )
}
