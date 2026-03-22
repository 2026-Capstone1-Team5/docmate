"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourcePreviewPanel } from "@/components/dashboard/source-preview-panel";
import { ResultViewerPanel } from "@/components/dashboard/result-viewer-panel";
import {
  deleteDocument,
  DocumentSummary,
  getDocumentResult,
  getDownloadUrl,
  getSourcePreviewMode,
  getSourceUrl,
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
  const [resultView, setResultView] = useState<"markdown" | "json">("markdown");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const previewUrl = doc ? getSourceUrl(doc.id) : null;
  const previewMode = doc
    ? getSourcePreviewMode({
        name: doc.filename,
        type: doc.contentType,
      })
    : null;
  const resultDownloadExt = resultView === "markdown" ? "md" : "json";
  const resultDownloadName = doc
    ? `${doc.filename.replace(/\.[^.]+$/, "")}.${resultDownloadExt}`
    : undefined;

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
    void fetchDocDetail();
  }, [documentId]);

  const handleDelete = async () => {
    if (!documentId) return;
    if (!confirm("이 문서를 삭제하시겠습니까?")) return;

    try {
      await deleteDocument(documentId);
      router.push("/documents");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setDeleteError(error.message);
      } else {
        setDeleteError("삭제 중 오류가 발생했습니다.");
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

  if (!doc || !result) {
    return (
      <div className="text-center py-20">
        <p>Document not found.</p>
        <Button variant="link" render={<Link href="/documents" />}>
          Return to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100svh-4rem)] min-h-[720px] flex-col overflow-hidden border-y border-zinc-200 bg-white lg:flex-row">
      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col border-b border-zinc-200 lg:basis-1/2 lg:border-b-0 lg:border-r">
        {previewUrl ? (
          <SourcePreviewPanel
            key={doc.id}
            fileName={doc.filename}
            previewUrl={previewUrl}
            mode={previewMode ?? "embed"}
            toolbarStart={(
              <Button
                variant="ghost"
                size="xs"
                render={<Link href="/documents" />}
                className="h-8 px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                목록
              </Button>
            )}
            downloadUrl={getSourceUrl(doc.id, "attachment")}
            downloadFileName={doc.filename}
            toolbarActions={(
              <>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                  aria-label="Delete document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          />
        ) : null}

        {errorMessage ? (
          <div className="mx-5 my-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {errorMessage}
          </div>
        ) : null}
        {deleteError ? (
          <div className="mx-5 my-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {deleteError}
          </div>
        ) : null}
      </section>

      <ResultViewerPanel
        panelTab="result"
        onPanelTabChange={() => {}}
        resultView={resultView}
        onResultViewChange={setResultView}
        showConfigTab={false}
        downloadUrl={getDownloadUrl(doc.id, resultView)}
        downloadFileName={resultDownloadName}
        resultTabDisabled={false}
        state="ready"
        markdownContent={result.markdown}
        jsonContent={result.canonicalJson}
      />
    </div>
  );
}
