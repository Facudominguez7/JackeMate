"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

export function BackButton() {
  const router = useRouter()

  return (
    <Button
      variant="secondary"
      size="icon-sm"
      onClick={() => router.back()}
      aria-label="Volver"
      title="Volver"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
    </Button>
  )
}
