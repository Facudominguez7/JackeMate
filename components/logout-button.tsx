"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

type ButtonSize = "sm" | "default" | "lg"

export function LogoutButton({ size = "sm" }: { size?: ButtonSize }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onLogout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      // Vuelve al inicio y refresca estado
      router.push("/")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size={size} onClick={onLogout} disabled={loading}>
      <LogOut className="w-4 h-4 mr-2" />
      {loading ? "Cerrando…" : "Cerrar sesión"}
    </Button>
  )
}
