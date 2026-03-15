"use client"

import { useState } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const handleLogout = async () => {
    setSubmitting(true)

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })
      router.replace("/login")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleLogout}
      disabled={submitting}
      className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      aria-label="로그아웃"
    >
      {submitting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </Button>
  )
}
