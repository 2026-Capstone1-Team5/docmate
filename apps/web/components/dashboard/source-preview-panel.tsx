"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import DocViewer, { DocViewerRenderers } from "@iamjariwala/react-doc-viewer";
import { Document, Page, pdfjs } from "react-pdf";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import {
  XlsxPreviewViewer,
  type XlsxSheetPreview,
} from "@/components/dashboard/xlsx-preview-viewer";

const PDF_VIEWPORT_WIDTH = 728;
const MAX_XLSX_PREVIEW_SHEETS = 5;
const MAX_XLSX_PREVIEW_ROWS = 200;
const MAX_XLSX_PREVIEW_COLUMNS = 50;

type PreviewStatus = "idle" | "loading" | "loaded" | "error";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function parsePreviewErrorMessage(rawText: string): string {
  try {
    const parsed = JSON.parse(rawText) as {
      error?: {
        message?: string;
      };
    };
    const message = parsed.error?.message?.trim();
    if (message) {
      return message;
    }
  } catch {
    // fall through
  }
  return "문서를 불러오지 못했습니다. API 연결 상태를 확인해 주세요.";
}

type SourcePreviewPanelProps = {
  fileName: string;
  previewUrl: string;
  toolbarStart?: ReactNode;
  toolbarActions?: ReactNode;
  downloadUrl?: string;
  downloadFileName?: string;
  mode: "pdf" | "image" | "docx" | "xlsx" | "pptx" | "embed";
};

export function SourcePreviewPanel({
  fileName,
  previewUrl,
  mode,
  toolbarStart,
  toolbarActions,
  downloadUrl,
  downloadFileName,
}: SourcePreviewPanelProps) {
  const isPdfPreview = mode === "pdf";
  const isPptxPreview = mode === "pptx";
  const supportsZoom =
    mode === "pdf" || mode === "image" || mode === "embed" || mode === "xlsx";
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>(
    isPdfPreview ? "idle" : mode === "image" ? "loaded" : "loading",
  );
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [xlsxSheets, setXlsxSheets] = useState<XlsxSheetPreview[]>([]);
  const [xlsxPreviewNotice, setXlsxPreviewNotice] = useState<string | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    let cancelled = false;

    const loadPreview = async () => {
      if (mode === "pdf" || mode === "image" || mode === "docx" || mode === "pptx" || mode === "embed") {
        setXlsxSheets([]);
        setXlsxPreviewNotice(null);
        if (mode !== "embed") {
          setPreviewStatus(mode === "image" ? "loaded" : "idle");
        } else {
          setPreviewStatus("loading");
        }
        return;
      }

      setPreviewStatus("loading");
      setPreviewMessage(null);
      setXlsxSheets([]);
      setXlsxPreviewNotice(null);

      try {
        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error("원문 미리보기를 불러오지 못했습니다.");
        }
        const arrayBuffer = await response.arrayBuffer();

        if (cancelled) {
          return;
        }

        if (mode === "xlsx") {
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          let previewWasTrimmed = workbook.SheetNames.length > MAX_XLSX_PREVIEW_SHEETS;
          const sheets = workbook.SheetNames
            .slice(0, MAX_XLSX_PREVIEW_SHEETS)
            .map((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
              header: 1,
              raw: false,
              blankrows: true,
            });
            const normalizedRows = rows.map((row) =>
              row.map((cell) => (cell == null ? "" : String(cell))),
            );
            const maxColumnCount = Math.min(
              normalizedRows.reduce(
              (max, row) => Math.max(max, row.length),
              0,
              ),
              MAX_XLSX_PREVIEW_COLUMNS,
            );
            if (
              normalizedRows.length > MAX_XLSX_PREVIEW_ROWS ||
              normalizedRows.some((row) => row.length > MAX_XLSX_PREVIEW_COLUMNS)
            ) {
              previewWasTrimmed = true;
            }
            return {
              name: sheetName,
              columns: Array.from({ length: maxColumnCount }, (_, index) =>
                XLSX.utils.encode_col(index),
              ),
              rows: normalizedRows.slice(0, MAX_XLSX_PREVIEW_ROWS).map((row) =>
                Array.from({ length: maxColumnCount }, (_, index) => row[index] ?? ""),
              ),
            };
          });
          setXlsxSheets(sheets);
          if (previewWasTrimmed) {
            setXlsxPreviewNotice(
              `미리보기는 최대 ${MAX_XLSX_PREVIEW_SHEETS}개 시트, 시트당 ${MAX_XLSX_PREVIEW_ROWS}행, ${MAX_XLSX_PREVIEW_COLUMNS}열까지만 표시합니다.`,
            );
          }
        }

        if (!cancelled) {
          setPreviewStatus("loaded");
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setPreviewMessage("원문 미리보기를 불러오지 못했습니다.");
          setPreviewStatus("error");
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [mode, previewUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === scrollContainerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const scrollToPage = (page: number, behavior: ScrollBehavior = "smooth") => {
    if (!isPdfPreview) {
      return;
    }
    const clamped = Math.min(Math.max(1, page), Math.max(1, pdfNumPages));
    setPdfPageNumber(clamped);
    const container = scrollContainerRef.current;
    const target = pageRefs.current[clamped];
    if (!container || !target) {
      return;
    }
    container.scrollTo({
      top: target.offsetTop - 12,
      behavior,
    });
  };

  const handlePdfScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || !pdfNumPages) {
      return;
    }
    const centerY = container.scrollTop + container.clientHeight / 2;
    let closestPage = pdfPageNumber;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let page = 1; page <= pdfNumPages; page += 1) {
      const node = pageRefs.current[page];
      if (!node) {
        continue;
      }
      const pageCenter = node.offsetTop + node.offsetHeight / 2;
      const distance = Math.abs(centerY - pageCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = page;
      }
    }

    if (closestPage !== pdfPageNumber) {
      setPdfPageNumber(closestPage);
    }
  };

  const handlePreviewLoad = () => {
    const iframeDocument = previewFrameRef.current?.contentDocument;
    const iframeContentType = iframeDocument?.contentType?.toLowerCase() ?? "";
    const iframeBodyText = iframeDocument?.body?.innerText?.trim() ?? "";

    if (
      (iframeContentType.includes("application/json") || iframeContentType.includes("text/plain")) &&
      iframeBodyText
    ) {
      setPreviewMessage(parsePreviewErrorMessage(iframeBodyText));
      setPreviewStatus("error");
      return;
    }

    setPreviewStatus("loaded");
  };

  const handlePreviewError = () => {
    setPreviewMessage("문서를 불러오지 못했습니다. API 연결 상태를 확인해 주세요.");
    setPreviewStatus("error");
  };

  const toggleFullscreen = async () => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
        return;
      }

      await container.requestFullscreen();
    } catch (error) {
      console.error("Failed to toggle fullscreen", error);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-y border-zinc-200 bg-white">
      {!isPptxPreview ? (
          <div className="flex h-12 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            {toolbarStart}
            <span className="max-w-[160px] truncate text-xs font-medium text-zinc-600">
              {fileName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPdfPreview ? (
            <>
              <button
                type="button"
                disabled={pdfPageNumber <= 1}
                onClick={() => scrollToPage(pdfPageNumber - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={Math.max(1, pdfNumPages)}
                  value={pdfPageNumber}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (!Number.isFinite(next)) {
                      return;
                    }
                    const clamped = Math.min(Math.max(1, next), Math.max(1, pdfNumPages));
                    scrollToPage(clamped, "auto");
                  }}
                  className="h-8 w-12 border-zinc-200 px-2 text-center text-sm"
                />
                <span className="text-sm text-zinc-500">of</span>
                <span className="text-sm text-zinc-500">{pdfNumPages || "?"}</span>
              </div>

              <button
                type="button"
                disabled={!pdfNumPages || pdfPageNumber >= pdfNumPages}
                onClick={() => scrollToPage(pdfPageNumber + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="mx-1 h-5 w-px bg-zinc-200" />
            </>
          ) : null}

          {supportsZoom ? (
            <>
              <button
                type="button"
                aria-label="Zoom Out"
                onClick={() => setZoomPercent((prev) => Math.max(60, prev - 10))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-14 text-center text-sm text-zinc-600">{zoomPercent}%</span>
              <button
                type="button"
                aria-label="Zoom In"
                onClick={() => setZoomPercent((prev) => Math.min(200, prev + 10))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Reset Zoom"
                onClick={() => setZoomPercent(100)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <div className="mx-1 h-5 w-px bg-zinc-200" />
            </>
          ) : null}

          <button
            type="button"
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            onClick={() => void toggleFullscreen()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          <div className="mx-1 h-5 w-px bg-zinc-200" />

          {downloadUrl ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
              aria-label="Download source"
              download={downloadFileName}
            >
              <Download className="h-4 w-4" />
            </a>
          ) : null}
          {toolbarActions}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <FileText className="h-3.5 w-3.5" />
            <span className="max-w-[120px] truncate">{fileName}</span>
          </div>
        </div>
      </div>
        ) : isPptxPreview ? (
          <div className="flex h-12 items-center gap-3 border-b border-zinc-200 bg-white px-4">
            <div className="flex items-center gap-2 overflow-hidden">
              {toolbarStart}
              <span className="max-w-[220px] truncate text-xs font-medium text-zinc-600">
                {fileName}
              </span>
            </div>
          </div>
        ) : null}

      <div
        ref={scrollContainerRef}
        onScroll={isPdfPreview ? handlePdfScroll : undefined}
        className="relative min-h-0 flex-1 overflow-auto bg-[#f3f3f3]"
        tabIndex={0}
      >
        {previewStatus === "error" ? (
          <div className="absolute inset-6 flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="mt-2 text-sm font-medium text-red-600">
              {previewMessage ?? "문서를 불러오지 못했습니다. API 연결 상태를 확인해 주세요."}
            </p>
          </div>
        ) : isPdfPreview ? (
          <div className="flex min-h-full justify-center p-4">
            <Document
              file={previewUrl}
              loading={
                <div className="flex h-[720px] w-[728px] items-center justify-center border border-zinc-300 bg-white">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-700" />
                </div>
              }
              onLoadSuccess={({ numPages }) => {
                setPdfNumPages(numPages);
                const currentPage = Math.min(Math.max(pdfPageNumber, 1), numPages);
                setPdfPageNumber(currentPage);
                setPreviewStatus("loaded");
              }}
              onLoadError={(error) => {
                console.error(error);
                setPreviewMessage("PDF 미리보기를 불러오지 못했습니다.");
                setPreviewStatus("error");
              }}
            >
              <div className="flex flex-col gap-4 pb-4">
                {Array.from({ length: pdfNumPages }, (_, idx) => idx + 1).map((page) => (
                  <div
                    key={page}
                    ref={(node) => {
                      pageRefs.current[page] = node;
                    }}
                    className="inline-block"
                  >
                    <Page
                      pageNumber={page}
                      width={PDF_VIEWPORT_WIDTH}
                      scale={zoomPercent / 100}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      className="border border-zinc-300 bg-white shadow-sm"
                    />
                  </div>
                ))}
              </div>
            </Document>
          </div>
        ) : mode === "image" ? (
          <div className="flex min-h-full items-start justify-center p-6">
            <Image
              src={previewUrl}
              alt={fileName}
              width={1280}
              height={960}
              unoptimized
              className="h-auto max-w-full rounded-xl border border-zinc-300 bg-white shadow-sm"
              style={{
                transform: `scale(${zoomPercent / 100})`,
                transformOrigin: "top center",
              }}
            />
          </div>
        ) : mode === "docx" ? (
          <div className="doc-viewer-embedded h-full bg-white">
            <DocViewer
              documents={[
                {
                  uri: previewUrl,
                  fileName,
                  fileType: mode,
                },
              ]}
              pluginRenderers={DocViewerRenderers}
              config={{
                header: {
                  disableHeader: true,
                  disableFileName: true,
                },
                fullscreen: {
                  enableFullscreen: false,
                },
                print: {
                  enablePrint: false,
                },
                pdfZoom: {
                  defaultZoom: 1,
                  zoomJump: 0.1,
                },
                themeMode: "light",
              }}
              style={{ height: "100%" }}
            />
          </div>
        ) : mode === "pptx" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
            <AlertCircle className="h-6 w-6 text-zinc-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-700">
                Preview is not supported for this format yet.
              </p>
              <p className="text-xs text-zinc-500">
                PPTX preview is not available in the current local viewer. You can still inspect the parsed result on the right.
              </p>
            </div>
          </div>
        ) : mode === "xlsx" && xlsxSheets.length ? (
          <div
            className="mx-auto h-full"
            style={{
              width: `${100 / (zoomPercent / 100)}%`,
              transform: `scale(${zoomPercent / 100})`,
              transformOrigin: "top center",
            }}
          >
            <XlsxPreviewViewer sheets={xlsxSheets} previewNotice={xlsxPreviewNotice} />
          </div>
        ) : mode === "embed" ? (
          <>
            <div
              className="mx-auto h-full"
              style={{
                width: `${100 / (zoomPercent / 100)}%`,
                transform: `scale(${zoomPercent / 100})`,
                transformOrigin: "top center",
              }}
            >
              <iframe
                ref={previewFrameRef}
                src={previewUrl}
                className="h-full w-full border-none"
                title="Document Preview"
                onLoad={handlePreviewLoad}
                onError={handlePreviewError}
              />
            </div>
            {previewStatus === "loading" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/25">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-700" />
                <p className="text-xs font-medium text-zinc-700">원문 미리보기를 불러오는 중입니다.</p>
              </div>
            ) : null}
          </>
        ) : previewStatus === "loading" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/5">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-700" />
            <p className="text-xs font-medium text-zinc-700">원문 미리보기를 불러오는 중입니다.</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-zinc-500">이 형식의 원문 미리보기를 준비하지 못했습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
