"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DocumentSummary, listDocuments } from "@/lib/document-agent-api";

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

  if (loading) return <div className="text-center py-20">목록을 불러오는 중...</div>;
  if (errorMessage) {
    return <div className="text-center py-20 text-red-600 dark:text-red-400">{errorMessage}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">문서 리스트</h1>
        <Link href="/upload" className="px-4 py-2 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 rounded-lg text-sm font-medium">새 문서 추가</Link>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">업로드된 문서가 없습니다.</div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">📄</span>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{doc.filename}</h3>
                  <p className="text-sm text-zinc-500">
                    {new Date(doc.createdAt).toLocaleDateString()} 업로드됨
                  </p>
                </div>
              </div>
              <span className="text-zinc-400 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
