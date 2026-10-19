"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"

type TurnstileRenderOptions = {
  sitekey: string
  callback: (token: string) => void
  "expired-callback": () => void
  "error-callback": () => void
  language?: string
}

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

/** Public Turnstile site key. When unset, CAPTCHA is disabled and the widget is not rendered. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void
  /** Increment to request a fresh challenge (tokens are single-use). */
  resetSignal: number
}

/**
 * Cloudflare Turnstile challenge for Supabase Auth CAPTCHA protection. The token is
 * forwarded to `signInAnonymously({ options: { captchaToken } })` and verified by
 * Supabase Auth with the secret configured in the dashboard.
 */
export function TurnstileWidget({ onTokenChange, resetSignal }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenChangeRef = useRef(onTokenChange)
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange
  }, [onTokenChange])

  useEffect(() => {
    const container = containerRef.current
    const turnstile = window.turnstile

    if (!scriptReady || !container || !turnstile || !TURNSTILE_SITE_KEY) {
      return
    }

    const widgetId = turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => onTokenChangeRef.current(token),
      "expired-callback": () => onTokenChangeRef.current(null),
      "error-callback": () => onTokenChangeRef.current(null),
      language: "es",
    })
    widgetIdRef.current = widgetId

    return () => {
      turnstile.remove(widgetId)
      widgetIdRef.current = null
    }
  }, [scriptReady])

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current) {
      window.turnstile?.reset(widgetIdRef.current)
    }
  }, [resetSignal])

  if (!TURNSTILE_SITE_KEY) {
    return null
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  )
}
