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
        setErrorMessage("유효하지 않은 문서 ID입니다.");
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
          setErrorMessage("문서를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDocDetail();
  }, [documentId]);

  const handleDelete = async () => {
    if (!documentId) return;
    if (!confirm("정말 이 문서를 삭제하시겠습니까?")) return;

    try {
      await deleteDocument(documentId);
      router.push("/documents");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  if (loading) return <div className="text-center py-20">문서 정보를 불러오는 중...</div>;
  if (errorMessage) {
    return <div className="text-center py-20 text-red-600 dark:text-red-400">{errorMessage}</div>;
  }
  if (!doc || !result) return <div className="text-center py-20">문서를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-8">
      <Link href="/documents" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
        ← 목록으로 돌아가기
      </Link>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{doc.filename}</h1>
            <p className="text-zinc-500">ID: {doc.id} · {new Date(doc.createdAt).toLocaleString()} 업로드됨</p>
          </div>
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-200 text-red-600 dark:border-red-900/30 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded-lg text-sm font-medium"
          >
            삭제하기
          </button>
        </div>

        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold">결과 다운로드</h3>
            <div className="flex gap-2">
              <a
                href={getDownloadUrl(doc.id, "markdown")}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Markdown 다운로드
              </a>
              <a
                href={getDownloadUrl(doc.id, "json")}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                JSON 다운로드
              </a>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Markdown 결과</h4>
              <pre className="bg-zinc-50 dark:bg-black rounded-2xl p-6 text-zinc-700 dark:text-zinc-300 min-h-[320px] leading-relaxed overflow-auto text-sm whitespace-pre-wrap">
                {result.markdown}
              </pre>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">JSON 결과</h4>
              <pre className="bg-zinc-50 dark:bg-black rounded-2xl p-6 text-zinc-700 dark:text-zinc-300 min-h-[320px] leading-relaxed overflow-auto text-sm">
                {JSON.stringify(result.canonicalJson, null, 2)}
              </pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
