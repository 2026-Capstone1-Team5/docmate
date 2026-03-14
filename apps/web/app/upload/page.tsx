"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/document-agent-api";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("파일을 선택해 주세요.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const parsed = await uploadDocument(file);
      router.push(`/documents/${parsed.document.id}`);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("업로드 중 오류가 발생했습니다.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      <h1 className="text-3xl font-bold tracking-tight">문서 업로드</h1>
      <form onSubmit={handleUpload} className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-900 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <span className="text-4xl mb-4">📁</span>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {file ? file.name : "클릭해서 파일을 선택하세요"}
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        <button
          disabled={uploading}
          className="w-full h-12 rounded-xl bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
        >
          {uploading ? "업로드 중..." : "업로드 시작"}
        </button>
        {errorMessage ? (
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        ) : null}
      </form>
    </div>
  );
}
