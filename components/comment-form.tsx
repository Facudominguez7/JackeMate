"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send } from "lucide-react"

interface CommentFormProps {
  onSubmit: (content: string) => void
  placeholder?: string
  buttonText?: string
}

export function CommentForm({
  onSubmit,
  placeholder = "Escribe tu comentario...",
  buttonText = "Comentar",
}: CommentFormProps) {
  const [content, setContent] = useState("")

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content)
      setContent("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="text-sm">UC</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Presiona Ctrl+Enter para enviar rápidamente</p>
            <Button onClick={handleSubmit} size="sm" disabled={!content.trim()}>
              <Send className="w-4 h-4 mr-2" />
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
