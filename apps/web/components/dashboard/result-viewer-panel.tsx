"use client";

import { ReactNode, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PanelTab } from "@/lib/document-agent-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Download,
  Copy,
  RotateCcw,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

type ResultView = "markdown" | "json";
type MarkdownMode = "preview" | "raw";

type ResultViewerPanelProps = {
  panelTab: PanelTab;
  onPanelTabChange: (next: PanelTab) => void;
  resultView: ResultView;
  onResultViewChange: (next: ResultView) => void;
  showConfigTab?: boolean;
  downloadUrl?: string;
  downloadFileName?: string;
  configContent?: ReactNode;
  configTitle?: string;
  configDescription?: ReactNode;
  emptyMarkdownMessage?: ReactNode;
  emptyJsonMessage?: string;
  resultTabDisabled?: boolean;
  onCopy?: () => void;
  onRefresh?: () => void;
} & (
  | {
      state: "ready";
      markdownContent: string;
      jsonContent: Record<string, unknown>;
    }
  | {
      state: "empty";
      markdownContent?: never;
      jsonContent?: never;
    }
);

export function ResultViewerPanel({
  panelTab,
  onPanelTabChange,
  resultView,
  onResultViewChange,
  showConfigTab = true,
  downloadUrl,
  downloadFileName,
  configContent,
  configTitle,
  configDescription,
  state,
  markdownContent,
  jsonContent,
  emptyMarkdownMessage,
  emptyJsonMessage,
  resultTabDisabled = false,
  onCopy,
  onRefresh,
}: ResultViewerPanelProps) {
  const isReady = state === "ready";
  const [markdownMode, setMarkdownMode] = useState<MarkdownMode>("preview");
  const markdownComponents = useMemo<Components>(
    () => ({
      h1: ({ children }) => (
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-950">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="mb-3 mt-8 text-2xl font-semibold tracking-tight text-zinc-900 first:mt-0">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mb-3 mt-6 text-lg font-semibold text-zinc-900 first:mt-0">
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500 first:mt-0">
          {children}
        </h4>
      ),
      p: ({ children }) => (
        <p className="mb-4 text-[14px] leading-7 text-zinc-700 last:mb-0">{children}</p>
      ),
      ul: ({ children }) => (
        <ul className="mb-4 list-disc space-y-2 pl-6 text-[14px] leading-7 text-zinc-700">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="mb-4 list-decimal space-y-2 pl-6 text-[14px] leading-7 text-zinc-700">
          {children}
        </ol>
      ),
      li: ({ children }) => <li className="pl-1">{children}</li>,
      blockquote: ({ children }) => (
        <blockquote className="mb-4 border-l-2 border-zinc-200 pl-4 italic text-zinc-600">
          {children}
        </blockquote>
      ),
      hr: () => <hr className="my-6 border-zinc-200" />,
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-zinc-900 underline underline-offset-4"
        >
          {children}
        </a>
      ),
      code: ({ className, children }) => {
        const isBlock = Boolean(className);
        if (isBlock) {
          return (
            <code className="font-mono text-[12px] leading-6 text-zinc-100">
              {children}
            </code>
          );
        }
        return (
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-800">
            {children}
          </code>
        );
      },
      pre: ({ children }) => (
        <pre className="mb-4 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-950/95 p-4 font-mono text-[12px] leading-6 shadow-sm">
          {children}
        </pre>
      ),
      table: ({ children }) => (
        <div className="mb-5 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full border-collapse bg-white text-left text-[13px] text-zinc-700">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-zinc-50">{children}</thead>,
      th: ({ children }) => (
        <th className="border-b border-r border-zinc-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-zinc-500 last:border-r-0">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="border-b border-r border-zinc-100 px-3 py-2 align-top text-[13px] last:border-r-0">
          {children}
        </td>
      ),
      strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
    }),
    [],
  );

  const resultContent = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 items-center justify-between border-b border-zinc-200 bg-white px-4">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  aria-label="Result format"
                >
                  {resultView === "markdown" ? "Markdown" : "JSON"}
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </Button>
              }
            />
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuRadioGroup
                  value={resultView}
                  onValueChange={(value) => onResultViewChange(value as ResultView)}
                >
                  <DropdownMenuRadioItem value="markdown">
                    Markdown
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="json">JSON</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {resultView === "markdown" ? (
            <div className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setMarkdownMode("preview")}
                className={`inline-flex h-7 items-center rounded-sm px-2.5 text-xs font-medium transition ${
                  markdownMode === "preview"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setMarkdownMode("raw")}
                className={`inline-flex h-7 items-center rounded-sm px-2.5 text-xs font-medium transition ${
                  markdownMode === "raw"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Raw
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" onClick={onCopy}>
            <Copy className="h-4 w-4" />
          </Button>
          {downloadUrl && (
            <a href={downloadUrl} download={downloadFileName}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900">
                <Download className="h-4 w-4" />
              </Button>
            </a>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" onClick={onRefresh}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-[#fbfbfb] p-5">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="p-6">
              {resultView === "markdown" ? (
                isReady ? (
                  markdownMode === "preview" ? (
                    <div className="max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {markdownContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="prose prose-zinc max-w-none">
                      <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-mono text-zinc-800 bg-transparent p-0">
                        {markdownContent}
                      </pre>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-sm text-zinc-500">
                      {emptyMarkdownMessage ?? "아직 결과가 없습니다."}
                    </p>
                  </div>
                )
              ) : (
                <pre className="text-[13px] leading-relaxed font-mono text-zinc-800 bg-transparent p-0 overflow-x-auto">
                  {isReady
                    ? JSON.stringify(jsonContent, null, 2)
                    : emptyJsonMessage ??
                      `{
  "status": "waiting_for_upload",
  "message": "파일 업로드 후 JSON 결과가 표시됩니다."
}`}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!showConfigTab) {
    return (
      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col border-t border-zinc-200 bg-[#fcfcfc] lg:basis-1/2 lg:border-t-0 lg:border-l">
        <div className="flex h-12 items-center border-b border-zinc-200 bg-white px-4">
          <div className="flex h-full items-center gap-2 border-b-2 border-zinc-900 px-1 text-sm font-medium text-zinc-900">
            <FileText className="h-4 w-4" />
            Results
          </div>
        </div>
        <div className="flex-1 min-h-0">{resultContent}</div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col border-t border-zinc-200 bg-[#fcfcfc] lg:basis-1/2 lg:border-t-0 lg:border-l">
      <Tabs
        value={panelTab}
        onValueChange={(value) => onPanelTabChange(value as PanelTab)}
        className="flex h-full min-h-0 flex-col"
      >
        <div className="flex h-12 items-center border-b border-zinc-200 bg-white px-4">
          <TabsList variant="line" className="h-full gap-6 bg-transparent p-0">
            <TabsTrigger
              value="config"
              className="flex h-full items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-1 text-sm font-medium text-zinc-500 shadow-none data-active:border-zinc-900 data-active:text-zinc-900"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Build
            </TabsTrigger>
            <TabsTrigger
              value="result"
              disabled={resultTabDisabled}
              className="flex h-full items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-1 text-sm font-medium text-zinc-500 shadow-none data-active:border-zinc-900 data-active:text-zinc-900"
            >
              <FileText className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="config" className="m-0 h-full min-h-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-6">
                <div className="mb-6">
                  <div className="mb-2">
                    <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                      {configTitle ?? "Configuration"}
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {configDescription ?? "Load a saved configuration or start fresh with defaults."}
                  </p>
                </div>

                <div className="space-y-6">
                  {configContent ?? (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-12 text-center">
                      <p className="text-sm text-zinc-500">
                        아직 설정 항목이 없습니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="result" className="m-0 flex h-full min-h-0 flex-col">
            {resultContent}
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
