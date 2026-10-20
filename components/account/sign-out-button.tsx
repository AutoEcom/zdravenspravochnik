"use client"

import { createClient } from "@/lib/supabase/client"

export function SignOutButton({ className }: { className?: string }) {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign("/")
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className={
        className ??
        "rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
      }
    >
      Изход
    </button>
  )
}
