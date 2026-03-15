"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DocumentSummary, listDocuments } from "@/lib/document-agent-api";
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ExternalLink, Loader2, AlertCircle, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function DocumentListPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const data = await listDocuments();
        setDocuments(data.items);
        setErrorMessage(null);
      } catch (error) {
        console.error(error);
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("문서 목록을 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  // 마지막 업로드 시간 계산
  const lastUploadTime = documents.length > 0 
    ? new Date(Math.max(...documents.map(d => new Date(d.createdAt).getTime()))).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      })
    : "업로드 기록 없음";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="text-zinc-500 font-medium">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 px-2 py-0 text-[10px]">문서 인덱스</Badge>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">검수할 문서를 선택하세요</h1>
            <p className="text-zinc-500 text-sm">파싱 결과를 다시 열고, Markdown/JSON 출력을 확인할 수 있는 문서 목록입니다.</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>전체 문서 {documents.length}건</span>
            <span className="text-zinc-200">|</span>
            <span>마지막 업로드 {lastUploadTime}</span>
            <span className="text-zinc-200">|</span>
            <span>출력 Markdown / JSON</span>
          </div>
        </div>
        <Button render={<Link href="/upload" />} className="h-10 px-6 rounded-lg font-bold shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          새 문서 추가
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="px-10 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/30">
          <div>
            <h2 className="text-lg font-bold">문서 목록</h2>
            <p className="text-zinc-500 text-xs">파일 형식과 업로드 시각을 확인하고, 검수할 문서를 바로 엽니다.</p>
          </div>
          <Badge variant="outline" className="text-[10px] font-normal text-zinc-400 border-zinc-200">총 {documents.length}건</Badge>
        </div>

        {errorMessage && (
          <div className="mx-10 mt-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
              <TableHead className="w-[450px] text-zinc-400 font-bold text-[11px] uppercase tracking-wider px-10 h-10">문서</TableHead>
              <TableHead className="text-zinc-400 font-bold text-[11px] uppercase tracking-wider h-10">형식</TableHead>
              <TableHead className="text-zinc-400 font-bold text-[11px] uppercase tracking-wider h-10">상태</TableHead>
              <TableHead className="text-zinc-400 font-bold text-[11px] uppercase tracking-wider h-10">업로드 시각</TableHead>
              <TableHead className="text-zinc-400 font-bold text-[11px] uppercase tracking-wider h-10 text-right px-10">열기</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-60 text-center text-zinc-400 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-zinc-200" />
                    <p>업로드된 문서가 없습니다.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 transition-colors group">
                  <TableCell className="px-10 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-primary transition-colors">{doc.filename}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{doc.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold text-zinc-400 border-zinc-200 rounded px-1.5 h-5">PDF</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 text-[10px] px-1.5 h-5 font-bold">준비됨</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-medium">
                    {new Date(doc.createdAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    })}
                  </TableCell>
                  <TableCell className="text-right px-10">
                    <Button variant="ghost" size="xs" render={<Link href={`/documents/${doc.id}`} />} className="text-[11px] font-bold text-zinc-800 hover:text-primary gap-1">
                      상세 보기
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
