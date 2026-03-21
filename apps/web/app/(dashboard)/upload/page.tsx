"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SourcePreviewPanel } from "@/components/dashboard/source-preview-panel";
import { ResultViewerPanel } from "@/components/dashboard/result-viewer-panel";
import {
  DocumentSummary,
  getDocumentResult,
  getParseJob,
  getSourceUrl,
  ParseResult,
  uploadDocument,
} from "@/lib/document-agent-api";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 60000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resultView, setResultView] = useState<"markdown" | "json">("markdown");
  const [parsedDocument, setParsedDocument] = useState<DocumentSummary | null>(null);
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null);
  const isActiveRef = useRef(true);

  const previewUrl = parsedDocument ? getSourceUrl(parsedDocument.id) : null;
  const isPdfPreview = Boolean(
    parsedDocument &&
      (parsedDocument.contentType.toLowerCase().includes("pdf") ||
        parsedDocument.filename.toLowerCase().endsWith(".pdf")),
  );

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const startUpload = async (selectedFile: File) => {
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setParsedDocument(null);
    setParsedResult(null);

    try {
      const queued = await uploadDocument(selectedFile);
      const startedAt = Date.now();

      while (isActiveRef.current && Date.now() - startedAt < POLL_TIMEOUT_MS) {
        const current = await getParseJob(queued.job.id);

        if (current.job.status === "failed") {
          throw new Error(current.job.errorMessage ?? "문서 파싱에 실패했습니다.");
        }

        if (current.job.documentId) {
          if (!isActiveRef.current) {
            return;
          }

          const parsed = await getDocumentResult(current.job.documentId);
          if (!isActiveRef.current) {
            return;
          }
          setParsedDocument(parsed.document);
          setParsedResult(parsed.result);
          setSuccessMessage("파싱이 완료되었습니다. 아래에서 원문과 결과를 바로 확인해 주세요.");
          return;
        }

        await wait(POLL_INTERVAL_MS);
      }

      if (isActiveRef.current) {
        setErrorMessage("업로드는 완료되었지만 파싱이 아직 진행 중입니다. 문서 목록에서 잠시 후 다시 확인해 주세요.");
      }
    } catch (error) {
      console.error(error);
      if (!isActiveRef.current) {
        return;
      }
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("업로드 처리 중 오류가 발생했습니다.");
      }
    } finally {
      if (isActiveRef.current) {
        setUploading(false);
      }
    }
  };

  const handleFileSelection = (selectedFile: File | null) => {
    if (!selectedFile || uploading) {
      return;
    }
    void startUpload(selectedFile);
  };

  return (
    <div className="-m-6 flex h-[calc(100svh-4rem)] min-h-[720px] flex-col overflow-hidden border-y border-zinc-200 bg-white lg:flex-row">
      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col border-b border-zinc-200 lg:border-b-0 lg:border-r">
        <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(196,212,130,0.16),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#fcfcf8_100%)]">
          <Input
            id="upload-file-input"
            type="file"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null;
              e.currentTarget.value = "";
              handleFileSelection(selectedFile);
            }}
            accept=".pdf,image/*"
          />

          {parsedDocument && parsedResult && previewUrl ? (
            <SourcePreviewPanel
              key={parsedDocument.id}
              fileName={parsedDocument.filename}
              previewUrl={previewUrl}
              mode={isPdfPreview ? "pdf" : "embed"}
              toolbarStart={(
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                  onClick={() => document.getElementById("upload-file-input")?.click()}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload
                </button>
              )}
              downloadUrl={getSourceUrl(parsedDocument.id, "attachment")}
              downloadFileName={parsedDocument.filename}
            />
          ) : (
            <button
              type="button"
              onClick={() => document.getElementById("upload-file-input")?.click()}
              className="m-5 flex flex-1 flex-col items-center justify-center gap-5 rounded-[28px] border border-dashed border-zinc-300 bg-white/80 px-10 text-center transition hover:border-zinc-400 hover:bg-white"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-[#d8e7a5] bg-[#f8fcd8]">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[#7d8c36]" />
                ) : (
                  <Upload className="h-8 w-8 text-[#7d8c36]" />
                )}
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-semibold tracking-tight text-zinc-900">
                  파일을 끌어 놓거나 클릭해서 선택하세요
                </p>
                <p className="mx-auto max-w-lg text-sm leading-6 text-zinc-500">
                  업로드가 시작되면 parse job을 생성하고, 결과 준비가 끝나면 이 화면에서 결과를 확인합니다.
                </p>
              </div>
              {file ? (
                <div className="rounded-full border border-[#d8e7a5] bg-[#f8fcd8] px-4 py-1.5 text-sm font-medium text-[#667226]">
                  {file.name}
                </div>
              ) : null}
            </button>
          )}

          <div className="px-5 py-4 text-sm text-zinc-500">
            {uploading
              ? "업로드가 진행 중입니다. 파싱 완료까지 잠시만 기다려 주세요."
              : "파일을 선택하면 자동으로 업로드를 시작합니다."}
          </div>

          {errorMessage ? (
            <div className="mx-5 mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mx-5 mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          ) : null}
        </div>
      </section>

      {parsedResult ? (
        <ResultViewerPanel
          resultView={resultView}
          onResultViewChange={setResultView}
          state="ready"
          markdownContent={parsedResult.markdown}
          jsonContent={parsedResult.canonicalJson}
        />
      ) : (
        <ResultViewerPanel
          resultView={resultView}
          onResultViewChange={setResultView}
          state="empty"
          emptyMarkdownMessage="아직 결과가 없습니다. 파일 업로드가 완료되면 이 영역에 실제 Markdown 결과가 표시됩니다."
        />
      )}
    </div>
  );
}
