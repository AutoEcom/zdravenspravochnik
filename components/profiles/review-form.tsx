"use client"

import { useActionState } from "react"

import { submitReview } from "@/lib/reviews/actions"
import { Button } from "@/components/ui/button"

const initial = { ok: false, message: "" }

export function ReviewForm({
  doctorId,
  facilityId,
  slug,
}: {
  doctorId?: string
  facilityId?: string
  slug: string
}) {
  const [state, action, pending] = useActionState(
    async (_state: typeof initial, formData: FormData) => submitReview(formData),
    initial
  )

  return (
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="doctor_id" value={doctorId ?? ""} />
      <input type="hidden" name="facility_id" value={facilityId ?? ""} />
      <input type="hidden" name="slug" value={slug} />
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Оценка</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-primary/15 bg-white/70 px-3 text-sm">
              <input type="radio" name="rating" value={value} required className="accent-primary" />
              {value}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-2 text-sm font-medium">
        Отзив
        <textarea
          name="comment"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 text-sm font-normal outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </label>
      <Button type="submit" variant="primary" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Запис..." : "Публикувай отзив"}
      </Button>
      {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
    </form>
  )
}
