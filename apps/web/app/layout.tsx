import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Document Agent",
  description: "AI Document Management Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50`}
      >
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
          <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
            <Link href="/" className="text-xl font-bold tracking-tight">
              📄 DocMate
            </Link>
            <div className="flex gap-6 text-sm font-medium">
              <Link href="/upload" className="hover:text-zinc-500 transition-colors">업로드</Link>
              <Link href="/documents" className="hover:text-zinc-500 transition-colors">문서 리스트</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
