import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getSession } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">
          <AppSidebar session={session} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white/50 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/50">
              <SidebarTrigger className="-ml-1" />
              <div className="flex h-full items-center gap-2 border-l border-zinc-200 pl-4 dark:border-zinc-800">
                <h1 className="text-sm font-semibold tracking-tight text-zinc-500">
                  Document Agent Dashboard
                </h1>
              </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 overflow-auto p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
