"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  FileSpreadsheet,
  FileText,
  FileType2,
  Loader2,
  Presentation,
  Sparkles,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ResultViewerPanel } from "@/components/dashboard/result-viewer-panel";
import {
  DEFAULT_PARSER_BACKEND,
  DOCUMENT_AI_PARSER_ENABLED,
  DocumentSummary,
  getDocumentResult,
  getParseJob,
  getSourcePreviewMode,
  getSourceUrl,
  isPdfFile,
  isSupportedUploadFile,
  PanelTab,
  ParseResult,
  ParserBackend,
  SUPPORTED_UPLOAD_ACCEPT,
  uploadDocument,
} from "@/lib/document-agent-api";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 60000;

const SourcePreviewPanel = dynamic(
  () => import("@/components/dashboard/source-preview-panel").then((module) => module.SourcePreviewPanel),
  { ssr: false },
);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parserLabel(parserBackend: ParserBackend): string {
  if (parserBackend === "markitdown") {
    return "MarkItDown";
  }
  if (parserBackend === "pdftotext") {
    return "pdftotext";
  }
  return "document_ai";
}

function UploadConfigPanel({
  parserBackend,
  uploading,
  onParserBackendChange,
}: {
  parserBackend: ParserBackend;
  uploading: boolean;
  onParserBackendChange: (next: ParserBackend) => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#73842a]" />
            <p className="text-sm font-semibold text-zinc-900">Parse Tier</p>
          </div>
          <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600">
            {parserLabel(parserBackend)}
          </Badge>
        </div>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          문서 형식에 맞는 parser를 선택합니다. 기본은 MarkItDown이며 `pdftotext`는 PDF에서만 사용할 수 있습니다.
        </p>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={() => onParserBackendChange("markitdown")}
            disabled={uploading}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              parserBackend === "markitdown"
                ? "border-[#96b24a] bg-[#f4f8df] shadow-[0_10px_30px_rgba(150,178,74,0.10)]"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900">MarkItDown</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  PDF, DOCX, PPTX, XLSX, PNG, JPG를 기본 경로로 처리합니다.
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-[#dbe6a6] bg-[#fbfde9] text-[#667226]"
              >
                기본
              </Badge>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onParserBackendChange("pdftotext")}
            disabled={uploading}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              parserBackend === "pdftotext"
                ? "border-[#96b24a] bg-[#f4f8df] shadow-[0_10px_30px_rgba(150,178,74,0.10)]"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900">pdftotext</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  내장 텍스트 PDF를 빠르게 fallback 처리할 때만 사용합니다.
                </p>
              </div>
              <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600">
                PDF 전용
              </Badge>
            </div>
          </button>

          {DOCUMENT_AI_PARSER_ENABLED ? (
            <button
              type="button"
              onClick={() => onParserBackendChange("document_ai")}
              disabled={uploading}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                parserBackend === "document_ai"
                  ? "border-[#96b24a] bg-[#f4f8df] shadow-[0_10px_30px_rgba(150,178,74,0.10)]"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">document_ai</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    PDF 전용 문서 AI 파서를 로컬 환경에서만 사용합니다.
                  </p>
                </div>
                <Badge variant="outline" className="border-[#dbe6a6] bg-[#fbfde9] text-[#667226]">
                  로컬 전용
                </Badge>
              </div>
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Supported Formats</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
            <div className="flex items-center gap-2 text-zinc-700">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">PDF / DOCX</span>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
            <div className="flex items-center gap-2 text-zinc-700">
              <Presentation className="h-4 w-4" />
              <span className="text-sm font-medium">PPTX</span>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
            <div className="flex items-center gap-2 text-zinc-700">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-sm font-medium">XLSX</span>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
            <div className="flex items-center gap-2 text-zinc-700">
              <FileType2 className="h-4 w-4" />
              <span className="text-sm font-medium">PNG / JPG</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>("config");
  const [parserBackend, setParserBackend] = useState<ParserBackend>(DEFAULT_PARSER_BACKEND);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resultView, setResultView] = useState<"markdown" | "json">("markdown");
  const [parsedDocument, setParsedDocument] = useState<DocumentSummary | null>(null);
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null);
  const isActiveRef = useRef(true);

  const previewUrl = parsedDocument ? getSourceUrl(parsedDocument.id) : null;
  const previewMode = parsedDocument
    ? getSourcePreviewMode({
        name: parsedDocument.filename,
        type: parsedDocument.contentType,
      })
    : null;

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const startUpload = async (selectedFile: File) => {
    if (!selectedFile) {
      return;
    }

    if (!isSupportedUploadFile(selectedFile)) {
      setErrorMessage("지원하지 않는 파일 형식입니다. PDF, DOCX, PPTX, XLSX, PNG, JPG 파일만 업로드할 수 있습니다.");
      setSuccessMessage(null);
      setParsedDocument(null);
      setParsedResult(null);
      setFile(null);
      setPanelTab("config");
      return;
    }

    if (parserBackend === "pdftotext" && !isPdfFile(selectedFile)) {
      setErrorMessage("`pdftotext` 파서는 PDF 파일에서만 사용할 수 있습니다. MarkItDown으로 바꾸거나 PDF를 선택해 주세요.");
      setSuccessMessage(null);
      setParsedDocument(null);
      setParsedResult(null);
      setFile(selectedFile);
      setPanelTab("config");
      return;
    }

    if (parserBackend === "document_ai" && !isPdfFile(selectedFile)) {
      setErrorMessage("`document_ai` 파서는 PDF 파일에서만 사용할 수 있습니다. PDF를 선택해 주세요.");
      setSuccessMessage(null);
      setParsedDocument(null);
      setParsedResult(null);
      setFile(selectedFile);
      setPanelTab("config");
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setPanelTab("config");
    setErrorMessage(null);
    setSuccessMessage(null);
    setParsedDocument(null);
    setParsedResult(null);

    try {
      const queued = await uploadDocument(selectedFile, { parserBackend });
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
          setPanelTab("result");
          setSuccessMessage("파싱이 완료되었습니다. 우측 Result 탭에서 결과를 확인해 주세요.");
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
      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col border-b border-zinc-200 lg:basis-1/2 lg:border-b-0 lg:border-r">
        <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(196,212,130,0.14),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#fcfcf8_100%)]">
          <Input
            id="upload-file-input"
            type="file"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null;
              e.currentTarget.value = "";
              handleFileSelection(selectedFile);
            }}
            accept={SUPPORTED_UPLOAD_ACCEPT}
          />

          {!parsedDocument ? (
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white/90 px-5 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                  onClick={() => document.getElementById("upload-file-input")?.click()}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload
                </button>
                {file ? (
                  <span className="text-sm font-medium text-zinc-600">1 file</span>
                ) : null}
                {file ? (
                  <div className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-700">
                    {file.name}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {parsedDocument && parsedResult && previewUrl ? (
            <SourcePreviewPanel
              key={parsedDocument.id}
              fileName={parsedDocument.filename}
              previewUrl={previewUrl}
              mode={previewMode ?? "embed"}
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
              className="m-5 flex flex-1 flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-300 bg-white/80 px-10 text-center transition hover:border-zinc-400 hover:bg-white"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8e7a5] bg-[#f8fcd8]">
                {uploading ? (
                  <Loader2 className="h-7 w-7 animate-spin text-[#7d8c36]" />
                ) : (
                  <Upload className="h-7 w-7 text-[#7d8c36]" />
                )}
              </div>
              <div className="mt-6 space-y-2">
                <p className="text-xl font-semibold tracking-tight text-zinc-900">
                  파일을 끌어 놓거나 클릭해서 선택하세요
                </p>
                <p className="mx-auto max-w-lg text-sm leading-6 text-zinc-500">
                  파일이 업로드되면 parse job을 만들고, 준비가 끝나면 우측 Results 탭에 구조화 결과를 표시합니다.
                </p>
              </div>
              {file ? (
                <div className="mt-5 rounded-full border border-[#d8e7a5] bg-[#f8fcd8] px-4 py-1.5 text-sm font-medium text-[#667226]">
                  {file.name}
                </div>
              ) : null}
              <p className="mt-10 max-w-md text-xs leading-5 text-zinc-400">
                Supported: PDF, DOCX, PPTX, XLSX, PNG, JPG
              </p>
            </button>
          )}

          {uploading ? (
            <div className="px-5 py-4 text-sm text-zinc-500">
              업로드가 진행 중입니다. 파싱 완료까지 잠시만 기다려 주세요.
            </div>
          ) : null}

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
          panelTab={panelTab}
          onPanelTabChange={setPanelTab}
          resultView={resultView}
          onResultViewChange={setResultView}
          resultTabDisabled={false}
          state="ready"
          markdownContent={parsedResult.markdown}
          jsonContent={parsedResult.canonicalJson}
          configTitle="Configuration"
          configDescription="Select a parser configuration before starting a parse run."
          configContent={(
            <UploadConfigPanel
              parserBackend={parserBackend}
              uploading={uploading}
              onParserBackendChange={setParserBackend}
            />
          )}
        />
      ) : (
        <ResultViewerPanel
          panelTab={panelTab}
          onPanelTabChange={setPanelTab}
          resultView={resultView}
          onResultViewChange={setResultView}
          resultTabDisabled
          state="empty"
          configTitle="Configuration"
          configDescription="Select a parser configuration before starting a parse run."
          configContent={(
            <UploadConfigPanel
              parserBackend={parserBackend}
              uploading={uploading}
              onParserBackendChange={setParserBackend}
            />
          )}
          emptyMarkdownMessage="아직 결과가 없습니다. 파일 업로드가 완료되면 이 영역에 실제 Markdown 결과가 표시됩니다."
        />
      )}
    </div>
  );
}
