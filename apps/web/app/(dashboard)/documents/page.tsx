"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DocumentSummary, listDocuments } from "@/lib/document-agent-api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function inferFileType(doc: DocumentSummary) {
  const type = doc.contentType?.split("/")[1]?.toUpperCase();
  if (type) {
    return type;
  }
  const ext = doc.filename.split(".").pop()?.toUpperCase();
  return ext || "FILE";
}

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

  const latestUpload = documents[0]?.createdAt ?? null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="text-zinc-500 font-medium">문서 목록을 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100svh-4rem)] min-h-[720px] flex-col overflow-hidden bg-white">
      <header className="border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Documents
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              문서 검수 대시보드
            </h1>
            <p className="text-sm text-zinc-500">
              업로드된 문서를 검색하고, 원문/Markdown/JSON 검수 화면으로 바로 이동합니다.
            </p>
          </div>
          <Button render={<Link href="/upload" />} className="h-10 px-5 font-semibold">
            <Plus className="mr-2 h-4 w-4" />
            새 업로드
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="hidden lg:inline">
            마지막 업로드: {latestUpload ? formatDate(latestUpload) : "없음"}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {errorMessage ? (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <ScrollArea className="h-full">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50/70">
                <TableHead className="h-10 px-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  문서
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  형식
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  상태
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  업로드 시각
                </TableHead>
                <TableHead className="h-10 px-6 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  열기
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-[360px] px-6">
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
                        <FileText className="h-6 w-6 text-zinc-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-zinc-700">
                          표시할 문서가 없습니다.
                        </p>
                        <p className="text-sm text-zinc-500">문서를 업로드하면 이 목록에 표시됩니다.</p>
                      </div>
                      <Button render={<Link href="/upload" />} variant="outline" className="h-9 px-4 font-semibold">
                        <Plus className="mr-2 h-4 w-4" />
                        문서 업로드
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="border-zinc-100 transition-colors hover:bg-zinc-50/60"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-zinc-800">{doc.filename}</span>
                        <span className="text-xs text-zinc-500">ID: {doc.id.slice(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="h-6 border-zinc-200 px-2 text-[10px] font-semibold text-zinc-500">
                        {inferFileType(doc)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="h-6 bg-zinc-100 px-2 text-[10px] font-semibold text-zinc-600">
                        준비됨
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-zinc-500">
                      {formatDate(doc.createdAt)}
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        render={<Link href={`/documents/${doc.id}`} />}
                        className="gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900"
                      >
                        상세 보기
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
