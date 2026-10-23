"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"

import { LoginForm } from "@/app/(auth)/login/login-form"
import { buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

const tip =
  "Ако сте този специалист или управлявате заведението, влезте и заявете профила с имейл за потвърждение. След това ще можете да редактирате данните."

export function ClaimProfileButton({ href, claimed }: { href: string; claimed: boolean }) {
  const tipId = useId()
  const touched = useRef(false)
  const signedIn = useRef<boolean | null>(null)
  const [tipOpen, setTipOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) signedIn.current = Boolean(data.session)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      signedIn.current = Boolean(session)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  if (claimed) {
    return (
      <p className="flex h-11 items-center justify-center rounded-xl border border-white/60 bg-white/40 px-4 text-center text-sm text-muted-foreground">
        Профилът се управлява
      </p>
    )
  }

  function onClaimClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (touched.current && !tipOpen) {
      event.preventDefault()
      setTipOpen(true)
      return
    }
    if (signedIn.current === true) return
    event.preventDefault()
    void openClaim()
  }

  async function openClaim() {
    if (signedIn.current === null) {
      const { data } = await createClient().auth.getSession()
      signedIn.current = Boolean(data.session)
    }
    if (signedIn.current) {
      window.location.assign(href)
      return
    }
    setTipOpen(false)
    setLoginOpen(true)
  }

  return (
    <>
      <span
        className="relative block"
        onMouseEnter={() => setTipOpen(true)}
        onMouseLeave={() => {
          if (!touched.current) setTipOpen(false)
        }}
      >
        <Link
          href={href}
          aria-describedby={tipId}
          className={buttonVariants({ variant: "outline", className: "w-full" })}
          onPointerDown={(event) => {
            touched.current = event.pointerType === "touch"
          }}
          onFocus={() => setTipOpen(true)}
          onBlur={() => {
            if (!touched.current) setTipOpen(false)
          }}
          onClick={onClaimClick}
        >
          Това е мой профил
        </Link>
        {tipOpen ? (
          <span
            role="tooltip"
            id={tipId}
            className="absolute bottom-[calc(100%+0.5rem)] left-1/2 z-50 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-left text-xs leading-relaxed text-foreground shadow-lg backdrop-blur-xl"
          >
            {tip}
          </span>
        ) : null}
      </span>
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вход</DialogTitle>
            <DialogDescription>
              След входа продължавате към заявяване на този профил.
            </DialogDescription>
          </DialogHeader>
          <LoginForm next={href} />
        </DialogContent>
      </Dialog>
    </>
  )
}
