"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface DocumentDetail {
  id: string;
  filename: string;
  created_at: string;
  content_preview?: string; // 예시: API가 내용 미리보기를 제공할 경우
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocDetail = async () => {
      try {
        const response = await fetch(`https://document-agent-api-production.up.railway.app/documents/${id}`);
        if (!response.ok) throw new Error("문서를 불러올 수 없습니다.");
        const data = await response.json();
        setDoc(data);
      } catch (error) {
        console.error(error);
        alert("문서를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDocDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("정말 이 문서를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`https://document-agent-api-production.up.railway.app/documents/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("삭제되었습니다.");
        router.push("/documents");
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="text-center py-20">문서 정보를 불러오는 중...</div>;
  if (!doc) return <div className="text-center py-20">문서를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-8">
      <Link href="/documents" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
        ← 목록으로 돌아가기
      </Link>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{doc.filename}</h1>
            <p className="text-zinc-500">ID: {doc.id} · {new Date(doc.created_at).toLocaleString()} 업로드됨</p>
          </div>
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-200 text-red-600 dark:border-red-900/30 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded-lg text-sm font-medium"
          >
            삭제하기
          </button>
        </div>

        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-semibold mb-4">문서 미리보기</h3>
          <div className="bg-zinc-50 dark:bg-black rounded-2xl p-6 text-zinc-700 dark:text-zinc-300 min-h-[200px] leading-relaxed">
            {doc.content_preview || "문서의 내용을 분석 중이거나 미리보기를 지원하지 않는 형식입니다."}
          </div>
        </div>
      </div>
    </div>
  );
}
