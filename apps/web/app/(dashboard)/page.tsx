"use client";

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Search, FileOutput, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DocumentSummary, listDocuments } from "@/lib/document-agent-api"

export default function Home() {
  const [recentDocs, setRecentDocs] = useState<DocumentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentDocs = async () => {
      try {
        const data = await listDocuments()
        // 최근 5개만 표시
        setRecentDocs(data.items.slice(0, 5))
      } catch (error) {
        console.error("Failed to fetch recent docs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecentDocs()
  }, [])

  const quickStarts = [
    {
      title: "문서 업로드",
      description: "복잡한 PDF, 오피스 문서, 이미지 문서를 바로 파싱합니다.",
      icon: Upload,
    },
    {
      title: "결과 검수",
      description: "원문 미리보기 자리와 구조화 결과를 같은 흐름에서 확인합니다.",
      icon: Search,
    },
    {
      title: "출력 활용",
      description: "Markdown과 JSON 결과를 다운로드하거나 후속 파이프라인에 연결합니다.",
      icon: FileOutput,
    },
  ]

  return (
    <div className="max-w-6xl space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Quick Start</h1>
        <p className="text-zinc-500 text-sm">업로드부터 결과 검수까지 가장 짧은 흐름으로 바로 시작합니다.</p>
      </div>

      <Card className="border-none shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50 p-6 md:p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800">
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 px-2 py-0 text-[10px]">업무형 도구 UI</Badge>
            <h2 className="text-2xl font-bold">문서 파싱 작업을 바로 시작하세요</h2>
            <p className="text-zinc-500 text-sm">이 홈 화면은 기능 카탈로그가 아니라, 업로드와 검수 작업으로 바로 들어가기 위한 시작 지점입니다.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {quickStarts.map((item, idx) => (
              <Card key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-none">
                <CardContent className="p-6 space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm">{item.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">Markdown 결과</Badge>
            <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">Canonical JSON</Badge>
            <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">원문 대비 Viewer</Badge>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800">
            <Button render={<Link href="/upload" />} className="h-10 px-6 rounded-lg font-bold">문서 업로드</Button>
            <Button variant="outline" render={<Link href="/documents" />} className="h-10 px-6 rounded-lg font-bold border-zinc-200">문서 목록 보기</Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">최근 문서</h2>
            <p className="text-zinc-500 text-xs">가장 최근에 처리한 문서를 다시 열어 검수할 수 있습니다.</p>
          </div>
          <Button variant="outline" size="xs" render={<Link href="/documents" />} className="text-[10px] h-7 px-3 border-zinc-200">전체 문서 보기</Button>
        </div>

        <Card className="rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-none overflow-hidden">
          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
            </div>
          ) : recentDocs.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-sm">
              최근에 업로드된 문서가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentDocs.map((doc) => (
                <Link 
                  key={doc.id} 
                  href={`/documents/${doc.id}`} 
                  className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-primary transition-colors">{doc.filename}</h3>
                    <p className="text-[10px] text-zinc-400">{new Date(doc.createdAt).toLocaleString()}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
