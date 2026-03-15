"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/document-agent-api";
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, AlertCircle, CheckCircle2, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select a file to upload.");
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
        setErrorMessage("An error occurred during upload.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl flex flex-col lg:flex-row gap-6 items-stretch">
      <div className="flex-1 space-y-6">
        <Card className="h-full border-none shadow-sm bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 px-2 py-0 text-[10px]">Drag and Drop</Badge>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">문서 업로드 워크벤치</h1>
                <p className="text-zinc-500 text-sm">파일을 올리면 즉시 파싱 요청을 보내고, 성공 시 상세 검수 화면으로 이동합니다.</p>
              </div>
            </div>

            <div className="flex items-center justify-center w-full">
              <label className="group flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/30 dark:bg-zinc-900/30 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-10 text-center space-y-4">
                  <div className="h-16 w-16 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-zinc-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">파일을 끌어 놓거나 클릭해서 선택하세요</p>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                      복잡한 PDF, Office 문서, 이미지 문서를 대상으로 Markdown과 JSON 결과를 동시에 생성하는 흐름을 기준으로 설계했습니다.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Badge variant="outline" className="text-[10px] text-zinc-400 font-normal">Markdown 결과</Badge>
                    <Badge variant="outline" className="text-[10px] text-zinc-400 font-normal">Canonical JSON</Badge>
                    <Badge variant="outline" className="text-[10px] text-zinc-400 font-normal">Preview-ready Viewer</Badge>
                  </div>
                  {file && (
                    <div className="pt-4 flex items-center gap-2 text-primary font-bold animate-in fade-in slide-in-from-bottom-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>{file.name}</span>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,image/*"
                />
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleUpload}
                disabled={uploading || !file}
                className="h-11 px-8 rounded-xl font-bold"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  "업로드 시작"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFile(null)}
                disabled={!file || uploading}
                className="h-11 px-8 rounded-xl font-bold border-zinc-200"
              >
                파일 다시 선택
              </Button>
            </div>
            
            {errorMessage && (
              <div className="flex items-center gap-2 p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="font-medium">{errorMessage}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="w-full lg:w-80">
        <Card className="h-full border-none shadow-sm bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 px-2 py-0 text-[10px]">Upload State</Badge>
              <div className="space-y-1">
                <h2 className="text-lg font-bold">현재 상태</h2>
                <p className="text-zinc-500 text-xs leading-relaxed">파일을 선택하면 바로 파싱 요청을 시작할 수 있습니다.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                {uploading ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <Sparkles className="h-5 w-5 text-zinc-400" />}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">STAGE</p>
                <p className="font-bold text-zinc-800 dark:text-zinc-200">
                  {uploading ? "업로드 및 파싱 중..." : (file ? "업로드 대기 중" : "파일 선택 대기 중")}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">이 브랜치에서 유지하는 업로드 규칙</h3>
              <ul className="space-y-3 text-[11px] text-zinc-500 leading-relaxed">
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>문서 업로드 뒤 즉시 상세 Viewer로 이동합니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>결과는 Markdown과 JSON을 모두 1급 출력으로 다룹니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>원문 미리보기 패널은 API 연결 전까지 placeholder 상태로 유지합니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
