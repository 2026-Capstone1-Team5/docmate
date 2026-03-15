import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocMate",
  description: "AI Document Management Agent",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-4 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex h-full items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                    <h1 className="text-sm font-semibold tracking-tight text-zinc-500">Document Agent Dashboard</h1>
                  </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
                  {children}
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
