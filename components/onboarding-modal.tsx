"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const steps = [
  ["Detectá", "un problema urbano."],
  ["Reportá", "con ubicación y, si podés, una foto."],
  ["Compartí", "para que la comunidad lo vea."],
  ["Seguí", "el estado hasta que se resuelva."],
] as const

const ONBOARDING_STORAGE_KEY = "reporty_onboarding_completed"

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!window.localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
        setIsOpen(true)
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const handleStart = () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true")
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        showClose={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="max-w-xl"
      >
        <DialogHeader className="pr-2">
          <DialogTitle className="text-xl sm:text-2xl">Bienvenido a Reporty</DialogTitle>
          <DialogDescription>
            Reporty conecta tus observaciones con la comunidad de Posadas.
          </DialogDescription>
        </DialogHeader>

        <ol className="grid gap-3 sm:grid-cols-2" aria-label="Cómo funciona Reporty">
          {steps.map(([title, description], index) => (
            <li key={title} className="flex gap-3 rounded-xl border border-border/70 bg-muted/40 p-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-sm leading-5 text-foreground">
                <strong>{title}</strong> {description}
              </p>
            </li>
          ))}
        </ol>

        <DialogFooter>
          <Button type="button" size="lg" className="w-full sm:w-auto" onClick={handleStart}>
              Comenzá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
