"use client";

import { type DragEvent, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  FileSpreadsheet,
  FileText,
  FileType2,
  Loader2,
  Presentation,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  uploadDocumentsBatch,
} from "@/lib/document-agent-api";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 60000;

const SourcePreviewPanel = dynamic(
  () => import("@/components/dashboard/source-preview-panel").then((module) => module.SourcePreviewPanel),        
  { ssr: false },
);

type ParsedBatchItem = {
  document: DocumentSummary;
  result: ParseResult;
};

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
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#73842a] dark:text-[#a3b84a]" />
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Parse Tier</p>
          </div>
          <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
            {parserLabel(parserBackend)}
          </Badge>
        </div>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          문서 형식에 맞는 parser를 선택합니다. 기본은 MarkItDown이며 `pdftotext`는 PDF에서만 사용할 수 있습니다. 
        </p>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={() => onParserBackendChange("markitdown")}
            disabled={uploading}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              parserBackend === "markitdown"
                ? "border-[#96b24a] bg-[#f4f8df] dark:bg-[#2c331a] shadow-[0_10px_30px_rgba(150,178,74,0.10)]"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">MarkItDown</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  PDF, DOCX, PPTX, XLSX, PNG, JPG를 기본 경로로 처리합니다.
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-[#dbe6a6] dark:border-[#4d5c26] bg-[#fbfde9] dark:bg-[#1a1e0d] text-[#667226] dark:text-[#a3b84a]"
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
                ? "border-[#96b24a] bg-[#f4f8df] dark:bg-[#2c331a] shadow-[0_10px_30px_rgba(150,178,74,0.10)]"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">pdftotext</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  내장 텍스트 PDF를 빠르게 fallback 처리할 때만 사용합니다.
                </p>
              </div>
              <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
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
                  ? "border-[#96b24a] bg-[#f4f8df] dark:bg-[#2c331a] shadow-[0_10px_30px_rgba(150,178,74,0.10)]"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">document_ai</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    PDF 전용 문서 AI 파서를 로컬 환경에서만 사용합니다.
                  </p>
                </div>
                <Badge variant="outline" className="border-[#dbe6a6] dark:border-[#4d5c26] bg-[#fbfde9] dark:bg-[#1a1e0d] text-[#667226] dark:text-[#a3b84a]">
                  로컬 전용
                </Badge>
              </div>
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Supported Formats</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-3">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">PDF / DOCX</span>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-3">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Presentation className="h-4 w-4" />
              <span className="text-sm font-medium">PPTX</span>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-3">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-sm font-medium">XLSX</span>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-3">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <FileType2 className="h-4 w-4" />
              <span className="text-sm font-medium">PNG / JPG</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function UploadButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className ?? "inline-flex h-8 items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"}
      onClick={() => document.getElementById("upload-file-input")?.click()}
    >
      <Upload className="mr-1.5 h-3.5 w-3.5" />
      Upload
    </button>
  );
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>("config");
  const [parserBackend, setParserBackend] = useState<ParserBackend>(DEFAULT_PARSER_BACKEND);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resultView, setResultView] = useState<"markdown" | "json">("markdown");
  const [parsedItems, setParsedItems] = useState<ParsedBatchItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
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

  const startUpload = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      return;
    }

    const unsupportedFile = selectedFiles.find((selectedFile) => !isSupportedUploadFile(selectedFile));
    if (unsupportedFile) {
      setErrorMessage("지원하지 않는 파일 형식입니다. PDF, DOCX, PPTX, XLSX, PNG, JPG 파일만 업로드할 수 있습니다.");
      setSuccessMessage(null);
      setParsedDocument(null);
      setParsedResult(null);
      setParsedItems([]);
      setSelectedDocumentId(null);
      setFiles([]);
      setPanelTab("config");
      return;
    }

    if (parserBackend === "pdftotext" && selectedFiles.some((selectedFile) => !isPdfFile(selectedFile))) {
      setErrorMessage("`pdftotext` 파서는 PDF 파일에서만 사용할 수 있습니다. MarkItDown으로 바꾸거나 PDF를 선택해 주세요.");
      setSuccessMessage(null);
      setParsedDocument(null);
      setParsedResult(null);
      setParsedItems([]);
      setSelectedDocumentId(null);
      setFiles(selectedFiles);
      setPanelTab("config");
      return;
    }

    if (parserBackend === "document_ai" && selectedFiles.some((selectedFile) => !isPdfFile(selectedFile))) {
      setErrorMessage("`document_ai` 파서는 PDF 파일에서만 사용할 수 있습니다. PDF를 선택해 주세요.");
      setSuccessMessage(null);
      setParsedDocument(null);
      setParsedResult(null);
      setParsedItems([]);
      setSelectedDocumentId(null);
      setFiles(selectedFiles);
      setPanelTab("config");
      return;
    }

    setFiles(selectedFiles);
    setUploading(true);
    setPanelTab("config");
    setErrorMessage(null);
    setSuccessMessage(null);
    setParsedDocument(null);
    setParsedResult(null);
    setParsedItems([]);
    setSelectedDocumentId(null);

    try {
      const queuedJobs = selectedFiles.length === 1
        ? [(await uploadDocument(selectedFiles[0], { parserBackend })).job]
        : (await uploadDocumentsBatch(selectedFiles, { parserBackend })).jobs;
      const startedAt = Date.now();

      while (isActiveRef.current && Date.now() - startedAt < POLL_TIMEOUT_MS) {
        const currentJobs = await Promise.all(
          queuedJobs.map(async (job) => (await getParseJob(job.id)).job),
        );
        const failedJob = currentJobs.find((job) => job.status === "failed");

        if (failedJob) {
          throw new Error(
            failedJob.errorMessage ?? `${failedJob.filename} 문서 파싱에 실패했습니다.`,
          );
        }

        const completedJobs = currentJobs.filter((job) => job.documentId);
        if (completedJobs.length === queuedJobs.length) {
          if (!isActiveRef.current) {
            return;
          }

          const parsed = await Promise.all(
            completedJobs.map(async (job) => {
              if (!job.documentId) {
                throw new Error(`${job.filename} 문서 결과를 찾지 못했습니다.`);
              }
              return getDocumentResult(job.documentId);
            }),
          );
          if (!isActiveRef.current) {
            return;
          }
          const nextParsedItems = parsed.map((item) => ({
            document: item.document,
            result: item.result,
          }));
          const firstParsedItem = nextParsedItems[0];
          setParsedItems(nextParsedItems);
          setSelectedDocumentId(firstParsedItem.document.id);
          setParsedDocument(firstParsedItem.document);
          setParsedResult(firstParsedItem.result);
          setPanelTab("result");
          setSuccessMessage(`${completedJobs.length}개 문서 파싱이 완료되었습니다. 파일을 선택해서 결과를 전환할 수 있습니다.`);
          return;
        }

        await wait(POLL_INTERVAL_MS);
      }

      if (isActiveRef.current) {
        setErrorMessage("업로드는 완료되었지만 일부 파싱이 아직 진행 중입니다. 문서 목록에서 잠시 후 다시 확인해 주세요.");
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

  const handleFileSelection = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0 || uploading) {
      return;
    }
    void startUpload(selectedFiles);
  };

  const selectParsedItem = (item: ParsedBatchItem) => {
    setSelectedDocumentId(item.document.id);
    setParsedDocument(item.document);
    setParsedResult(item.result);
    setPanelTab("result");
  };

  const tabItems = parsedItems.length > 0
    ? parsedItems.map((item) => ({
        id: item.document.id,
        filename: item.document.filename,
      }))
    : files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        filename: file.name,
      }));
  const activeTabValue = selectedDocumentId ?? tabItems[0]?.id ?? "";

  const handleTabChange = (nextValue: string | number | null) => {
    if (typeof nextValue !== "string") {
      return;
    }
    const nextParsedItem = parsedItems.find((item) => item.document.id === nextValue);
    if (nextParsedItem) {
      selectParsedItem(nextParsedItem);
    }
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);
    handleFileSelection(Array.from(event.dataTransfer.files));
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!uploading) {
      setIsDraggingFiles(true);
    }
  };

  return (
    <div className="-m-6 flex h-[calc(100svh-4rem)] min-h-[720px] flex-col overflow-hidden border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 lg:flex-row">
      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col border-b border-zinc-200 dark:border-zinc-800 lg:basis-1/2 lg:border-b-0 lg:border-r">
        <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(196,212,130,0.14),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#fcfcf8_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(196,212,130,0.05),_transparent_34%),linear-gradient(180deg,#09090b_0%,#09090b_100%)]">
          <Input
            id="upload-file-input"
            type="file"
            className="hidden"
            onChange={(e) => {
              const selectedFiles = Array.from(e.target.files ?? []);
              e.currentTarget.value = "";
              handleFileSelection(selectedFiles);
            }}
            accept={SUPPORTED_UPLOAD_ACCEPT}
            multiple
          />

          {tabItems.length > 0 ? (
            <div className="flex min-h-12 items-center gap-3 overflow-x-auto border-b border-zinc-200 bg-white px-5 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              <UploadButton />
              <span className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {tabItems.length} file{tabItems.length === 1 ? "" : "s"}
              </span>
              <Tabs
                value={activeTabValue}
                onValueChange={handleTabChange}
                className="min-w-0 flex-1"
              >
                <TabsList
                  variant="line"
                  className="h-auto max-w-full justify-start gap-2 overflow-x-auto p-0"
                >
                  {tabItems.map((item) => (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className="h-10 max-w-[270px] shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-600 data-active:bg-white data-active:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:data-active:bg-zinc-950 dark:data-active:text-zinc-50"
                    >
                      <span className="truncate">{item.filename}</span>
                      <Trash2 className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          ) : null}

          {parsedDocument && parsedResult && previewUrl ? (
            <>
              <SourcePreviewPanel
                key={parsedDocument.id}
                fileName={parsedDocument.filename}
                previewUrl={previewUrl}
                mode={previewMode ?? "embed"}
                toolbarStart={(
                  <UploadButton className="inline-flex h-8 items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800" />
                )}
                downloadUrl={getSourceUrl(parsedDocument.id, "attachment")}
                downloadFileName={parsedDocument.filename}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => document.getElementById("upload-file-input")?.click()}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDraggingFiles(false)}
              onDrop={handleDrop}
              className={`m-5 flex flex-1 flex-col items-center justify-center rounded-[28px] border border-dashed px-10 text-center transition ${
                isDraggingFiles
                  ? "border-[#96b24a] bg-[#f8fcd8] dark:border-[#4d5c26] dark:bg-[#1a1e0d]"
                  : "border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-900"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8e7a5] dark:border-[#4d5c26] bg-[#f8fcd8] dark:bg-[#1a1e0d]">
                {uploading ? (
                  <Loader2 className="h-7 w-7 animate-spin text-[#7d8c36] dark:text-[#a3b84a]" />
                ) : (
                  <Upload className="h-7 w-7 text-[#7d8c36] dark:text-[#a3b84a]" />
                )}
              </div>
              <div className="mt-6 space-y-2">
                <p className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  파일들을 끌어 놓거나 클릭해서 선택하세요
                </p>
                <p className="mx-auto max-w-lg text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  파일이 업로드되면 parse job을 만들고, 준비가 끝나면 우측 Results 탭에 구조화 결과를 표시합니다. 여러 파일을 한 번에 선택할 수 있습니다.
                </p>
              </div>
              {files.length > 0 ? (
                <div className="mt-5 rounded-full border border-[#d8e7a5] dark:border-[#4d5c26] bg-[#f8fcd8] dark:bg-[#1a1e0d] px-4 py-1.5 text-sm font-medium text-[#667226] dark:text-[#a3b84a]">
                  {files.length === 1 ? files[0].name : `${files.length}개 파일 선택됨`}
                </div>
              ) : null}
              <p className="mt-10 max-w-md text-xs leading-5 text-zinc-400">
                Supported: PDF, DOCX, PPTX, XLSX, PNG, JPG
              </p>
            </button>
          )}

          {uploading ? (
            <div className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">
              업로드가 진행 중입니다. 파싱 완료까지 잠시만 기다려 주세요.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mx-5 mb-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mx-5 mb-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
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
