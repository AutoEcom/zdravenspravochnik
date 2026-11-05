"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const startEvent = "zs-nav-start"

export function beginNavigation() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(startEvent))
}

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
}

function isLocalNavigation(url: URL, current: URL) {
  if (url.origin !== current.origin) return false
  if (url.pathname === current.pathname && url.search === current.search) return false
  return true
}

function NavigationProgressBar() {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const route = `${pathname}?${search}`
  const routeRef = useRef(route)
  const running = useRef(false)
  const trickle = useRef<number | null>(null)
  const hide = useRef<number | null>(null)
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)
  const startRef = useRef<() => void>(() => {})
  const finishRef = useRef<() => void>(() => {})

  function clearTimers() {
    if (trickle.current !== null) window.clearInterval(trickle.current)
    if (hide.current !== null) window.clearTimeout(hide.current)
    trickle.current = null
    hide.current = null
  }

  function start() {
    if (running.current) return
    running.current = true
    clearTimers()
    setVisible(true)
    setWidth(16)
    trickle.current = window.setInterval(() => {
      setWidth((current) => (current >= 90 ? current : current + Math.max(1, (90 - current) * 0.15)))
    }, 200)
    hide.current = window.setTimeout(() => finishRef.current(), 8000)
  }

  function finish() {
    if (!running.current) return
    running.current = false
    if (trickle.current !== null) window.clearInterval(trickle.current)
    trickle.current = null
    if (hide.current !== null) window.clearTimeout(hide.current)
    setWidth(100)
    hide.current = window.setTimeout(() => {
      setVisible(false)
      setWidth(0)
      hide.current = null
    }, 220)
  }

  startRef.current = start
  finishRef.current = finish

  useEffect(() => {
    if (route === routeRef.current) return
    routeRef.current = route
    finishRef.current()
  }, [route])

  useEffect(() => {
    function onStart() {
      startRef.current()
    }
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) return
      const anchor = (event.target as Element | null)?.closest("a")
      if (!anchor) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.hasAttribute("download")) return
      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#")) return
      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      if (!isLocalNavigation(url, new URL(window.location.href))) return
      startRef.current()
    }
    function onSubmit(event: SubmitEvent) {
      if (event.defaultPrevented) return
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      if (form.target && form.target !== "_self") return
      const action = form.getAttribute("action")
      if (!action || action.startsWith("#")) return
      let url: URL
      try {
        url = new URL(action, window.location.href)
      } catch {
        return
      }
      if (!isLocalNavigation(url, new URL(window.location.href))) return
      startRef.current()
    }
    window.addEventListener(startEvent, onStart)
    document.addEventListener("click", onClick, true)
    document.addEventListener("submit", onSubmit, true)
    return () => {
      window.removeEventListener(startEvent, onStart)
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("submit", onSubmit, true)
      clearTimers()
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px]"
    >
      <div
        className="h-full origin-left bg-primary"
        style={{
          transform: `scaleX(${width / 100})`,
          opacity: visible ? 1 : 0,
          transition: visible ? "transform 180ms ease-out, opacity 180ms ease-out" : "opacity 180ms ease-out",
        }}
      />
    </div>
  )
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  )
}
