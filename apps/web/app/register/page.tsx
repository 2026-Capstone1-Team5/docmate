import { redirect } from "next/navigation"

import { LoginAsciiPanel } from "@/components/login-ascii-panel"
import { RegisterForm } from "@/components/register-form"
import { getSession } from "@/lib/auth"

export default async function RegisterPage() {
  const session = await getSession()

  if (session) {
    redirect("/")
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="grid min-h-screen lg:grid-cols-[minmax(520px,1fr)_minmax(420px,0.86fr)]">
        <section className="hidden lg:block">
          <LoginAsciiPanel />
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-16">
          <div className="relative w-full max-w-xl">
            <RegisterForm />
          </div>
        </section>
      </div>
    </main>
  )
}
