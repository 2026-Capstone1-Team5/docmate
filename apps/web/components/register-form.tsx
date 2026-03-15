"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (password !== confirmPassword) {
      setErrorMessage("비밀번호 확인이 일치하지 않습니다.")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null

      if (!response.ok) {
        throw new Error(
          payload?.error?.message || "회원가입 요청을 처리하지 못했습니다.",
        )
      }

      router.replace("/")
      router.refresh()
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("회원가입 중 알 수 없는 오류가 발생했습니다.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-[390px] rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.48))] p-8 shadow-[0_32px_80px_-34px_rgba(77,81,48,0.45)] backdrop-blur-xl">
      <div className="space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-[#43472b]">
            Create account
          </h1>
          <p className="text-sm text-[#838768]">
            Join the secure review workspace.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="register-email">
            Email
          </label>
          <Input
            id="register-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="h-12 rounded-xl border-[#d6d8c7] bg-white/75 px-4 text-sm text-[#4c5030] shadow-none placeholder:text-[#9a9d87] focus-visible:border-[#8e9452] focus-visible:ring-[#d3d7a8] dark:border-[#d6d8c7] dark:bg-white/75 dark:text-[#4c5030] dark:focus-visible:ring-[#d3d7a8]"
          />

          <label className="sr-only" htmlFor="register-password">
            Password
          </label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              className="h-12 rounded-xl border-[#d6d8c7] bg-white/75 px-4 pr-11 text-sm text-[#4c5030] shadow-none placeholder:text-[#9a9d87] focus-visible:border-[#8e9452] focus-visible:ring-[#d3d7a8] dark:border-[#d6d8c7] dark:bg-white/75 dark:text-[#4c5030] dark:focus-visible:ring-[#d3d7a8]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#8f927a] transition-colors hover:text-[#656947]"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <label className="sr-only" htmlFor="register-password-confirm">
            Confirm password
          </label>
          <div className="relative">
            <Input
              id="register-password-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="h-12 rounded-xl border-[#d6d8c7] bg-white/75 px-4 pr-11 text-sm text-[#4c5030] shadow-none placeholder:text-[#9a9d87] focus-visible:border-[#8e9452] focus-visible:ring-[#d3d7a8] dark:border-[#d6d8c7] dark:bg-white/75 dark:text-[#4c5030] dark:focus-visible:ring-[#d3d7a8]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#8f927a] transition-colors hover:text-[#656947]"
              aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <p className="text-center text-[11px] text-[#8a8d74]">
            Use a valid email address and a password with at least 8 characters.
          </p>

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl border-0 bg-[linear-gradient(180deg,#98a05a_0%,#7e8545_100%)] font-semibold text-white shadow-[0_18px_34px_-18px_rgba(93,98,52,0.7)] hover:opacity-95"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Create account
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="space-y-4 pt-1 text-center text-[11px] text-[#8a8d74]">
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#5a6036] underline decoration-[#b8bc98] underline-offset-2"
            >
              Sign in
            </Link>
          </p>
          <p>
            By continuing, you agree to our{" "}
            <span className="underline underline-offset-2">Terms of Service</span>
            {" "}and{" "}
            <span className="underline underline-offset-2">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
