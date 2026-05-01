"use client"

import Image from "next/image"
import { useTheme } from "./theme-provider"

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="ml-auto flex items-center justify-center rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      aria-label="Toggle dark mode"
    >
      <Image
        src="/owl_icon.png"
        alt="Owl Icon"
        width={24}
        height={24}
        className="h-6 w-6 object-contain dark:invert"
      />
    </button>
  )
}
