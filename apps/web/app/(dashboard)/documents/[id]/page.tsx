"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  deleteDocument,
  DocumentSummary,
  getDocumentResult,
  getDownloadUrl,
  ParseResult,
} from "@/lib/document-agent-api";
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trash2, Download, FileJson, FileText, Loader2, AlertCircle, EyeOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentSummary | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocDetail = async () => {
      if (!documentId) {
        setErrorMessage("Invalid document ID.");
        setLoading(false);
        return;
      }

      try {
        const data = await getDocumentResult(documentId);
        setDoc(data.document);
        setResult(data.result);
        setErrorMessage(null);
      } catch (error) {
        console.error(error);
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("An error occurred while loading the document.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDocDetail();
  }, [documentId]);

  const handleDelete = async () => {
    if (!documentId) return;
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument(documentId);
      router.push("/documents");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An error occurred during deletion.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="text-zinc-500 font-medium">Loading document details...</p>
      </div>
    );
  }

  if (!doc || !result) return (
    <div className="text-center py-20">
      <p>Document not found.</p>
      <Button variant="link" render={<Link href="/documents" />}>Return to Library</Button>
    </div>
  );

  return (
    <div className="max-w-full space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="xs" render={<Link href="/documents" />} className="text-xs font-bold text-zinc-500 hover:text-zinc-800">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            목록으로 돌아가기
          </Button>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] font-bold text-zinc-400 border-zinc-200 bg-white dark:bg-zinc-900 h-5">PDF</Badge>
            <Badge variant="outline" className="text-[10px] font-bold text-zinc-400 border-zinc-200 bg-white dark:bg-zinc-900 h-5">Preview Pending</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{doc.filename}</h1>
        <p className="text-zinc-400 text-xs">
          {new Date(doc.createdAt).toLocaleString()} 업로드
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="xs" render={<a href={getDownloadUrl(doc.id, "markdown")} />} className="h-8 px-4 font-bold border-zinc-200 gap-2">
          <Download className="h-3.5 w-3.5" />
          Markdown 다운로드
        </Button>
        <Button variant="outline" size="xs" render={<a href={getDownloadUrl(doc.id, "json")} />} className="h-8 px-4 font-bold border-zinc-200 gap-2">
          <Download className="h-3.5 w-3.5" />
          JSON 다운로드
        </Button>
        <Button variant="destructive" size="xs" onClick={handleDelete} className="h-8 px-4 font-bold gap-2 bg-red-800 hover:bg-red-900">
          <Trash2 className="h-3.5 w-3.5" />
          삭제
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
        {/* Left Panel: Original Preview */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex flex-col overflow-hidden">
          <CardHeader className="p-6 border-b border-zinc-50 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/30">
            <div className="space-y-1">
              <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 px-2 py-0 text-[10px]">Original Preview</Badge>
              <h2 className="text-lg font-bold">원문 미리보기 패널</h2>
              <p className="text-zinc-400 text-xs text-balance">원문 파일 또는 preview endpoint가 연결되면 이 영역에서 직접 내용을 검수합니다.</p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center bg-zinc-50/20 dark:bg-zinc-900/20 relative">
             <div className="absolute inset-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="h-16 w-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm border border-zinc-50 dark:border-zinc-700">
                  <EyeOff className="h-8 w-8 text-zinc-200" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">PDF 미리보기 패널</h3>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    현재 API 응답에는 원문을 직접 임베드할 preview URL이 포함되어 있지 않습니다. backend가 sourceUrl 또는 preview endpoint를 제공하면 이 패널에 바로 연결됩니다.
                  </p>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Right Panel: Structured Outputs */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex flex-col overflow-hidden">
          <CardHeader className="p-6 border-b border-zinc-50 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/30">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 px-2 py-0 text-[10px]">Structured Outputs</Badge>
                <h2 className="text-lg font-bold">Markdown / JSON 결과</h2>
                <p className="text-zinc-400 text-xs">두 결과를 같은 수준의 산출물로 보고, 탭 전환으로 빠르게 확인합니다.</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-zinc-300 font-medium">{new Date(doc.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <Tabs defaultValue="markdown" className="w-full h-full flex flex-col">
              <div className="px-6 py-4">
                <TabsList className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl h-10 p-1">
                  <TabsTrigger value="markdown" className="rounded-lg px-6 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    Markdown
                  </TabsTrigger>
                  <TabsTrigger value="json" className="rounded-lg px-6 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <FileJson className="h-3.5 w-3.5 mr-2" />
                    JSON
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 px-6 pb-6 overflow-hidden">
                <TabsContent value="markdown" className="m-0 h-full">
                  <ScrollArea className="h-full w-full rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
                    <pre className="text-xs leading-loose whitespace-pre-wrap font-mono text-zinc-800 dark:text-zinc-200">
                      {result.markdown}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="json" className="m-0 h-full">
                  <ScrollArea className="h-full w-full rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
                    <pre className="text-xs leading-relaxed font-mono text-zinc-800 dark:text-zinc-200">
                      {JSON.stringify(result.canonicalJson, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
