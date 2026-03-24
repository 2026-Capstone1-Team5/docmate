import { buildApiUrl, requestJson, requestVoid } from "@/lib/api-client";

export const DOCUMENT_AI_PARSER_ENABLED =
  process.env.NEXT_PUBLIC_DOCUMENT_AI_PARSER_ENABLED === "true"

export type ParserBackend = "markitdown" | "pdftotext" | "document_ai"
export type PanelTab = "config" | "result"
export type SourcePreviewMode = "pdf" | "image" | "docx" | "xlsx" | "pptx" | "embed"

export const DEFAULT_PARSER_BACKEND: ParserBackend = "markitdown"
export const SUPPORTED_UPLOAD_ACCEPT =
  ".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,image/png,image/jpeg"
export const SUPPORTED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".pptx",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
] as const

export type DocumentSummary = {
  id: string;
  filename: string;
  contentType: string;
  createdAt: string;
  updatedAt: string;
};

export type ParseResult = {
  markdown: string;
  canonicalJson: Record<string, unknown>;
};

export type DocumentResponse = {
  document: DocumentSummary;
};

export type ParseJobSummary = {
  id: string;
  filename: string;
  contentType: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  documentId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type ParseJobResponse = {
  job: ParseJobSummary;
};

export type DocumentParseResponse = {
  document: DocumentSummary;
  result: ParseResult;
};

export type DocumentListResponse = {
  items: DocumentSummary[];
  total: number;
  limit: number;
  offset: number;
};

export type DownloadFormat = "markdown" | "json";

const API_ROOT = "/api/documents";
const PARSE_JOBS_API_ROOT = "/api/parse-jobs";

export async function uploadDocument(
  file: File,
  options?: {
    parserBackend?: ParserBackend
  },
): Promise<ParseJobResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const query = new URLSearchParams()
  query.set("parserBackend", options?.parserBackend ?? DEFAULT_PARSER_BACKEND)

  return requestJson<ParseJobResponse>({
    apiRoot: API_ROOT,
    path: "/",
    query,
    init: {
      method: "POST",
      body: formData,
    },
    fallbackMessage: "API 요청에 실패했습니다.",
  });
}

export async function getParseJob(jobId: string): Promise<ParseJobResponse> {
  return requestJson<ParseJobResponse>({
    apiRoot: PARSE_JOBS_API_ROOT,
    path: `/${jobId}`,
    init: {
      method: "GET",
    },
    fallbackMessage: "파싱 작업 상태를 불러오지 못했습니다.",
  });
}

export async function listDocuments(params?: {
  limit?: number;
  offset?: number;
  filename?: string;
}): Promise<DocumentListResponse> {
  const query = new URLSearchParams();
  if (params?.limit !== undefined) {
    query.set("limit", String(params.limit));
  }
  if (params?.offset !== undefined) {
    query.set("offset", String(params.offset));
  }
  if (params?.filename) {
    query.set("filename", params.filename);
  }

  return requestJson<DocumentListResponse>({
    apiRoot: API_ROOT,
    path: "/",
    init: {
      method: "GET",
    },
    query,
    fallbackMessage: "API 요청에 실패했습니다.",
  });
}

export async function getDocument(
  documentId: string,
): Promise<DocumentResponse> {
  return requestJson<DocumentResponse>({
    apiRoot: API_ROOT,
    path: `/${documentId}`,
    init: {
      method: "GET",
    },
    fallbackMessage: "API 요청에 실패했습니다.",
  });
}

export async function getDocumentResult(
  documentId: string,
): Promise<DocumentParseResponse> {
  return requestJson<DocumentParseResponse>({
    apiRoot: API_ROOT,
    path: `/${documentId}/result`,
    init: {
      method: "GET",
    },
    fallbackMessage: "API 요청에 실패했습니다.",
  });
}

export async function deleteDocument(documentId: string): Promise<void> {
  await requestVoid({
    apiRoot: API_ROOT,
    path: `/${documentId}`,
    init: {
      method: "DELETE",
    },
    fallbackMessage: "API 요청에 실패했습니다.",
  });
}

export function getDownloadUrl(
  documentId: string,
  format: DownloadFormat,
): string {
  const query = new URLSearchParams({ format });
  return buildApiUrl(API_ROOT, `/${documentId}/download`, query);
}

export function getSourceUrl(
  documentId: string,
  disposition: "inline" | "attachment" = "inline",
): string {
  const query = new URLSearchParams({ disposition });
  return buildApiUrl(API_ROOT, `/${documentId}/source`, query);
}

export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".")
  if (lastDotIndex < 0) {
    return ""
  }
  return filename.slice(lastDotIndex).toLowerCase()
}

export function isPdfFile(file: Pick<File, "name" | "type">): boolean {
  return (
    file.type.toLowerCase().includes("pdf") ||
    getFileExtension(file.name) === ".pdf"
  )
}

export function getSourcePreviewMode(
  file: Pick<File, "name" | "type">
): SourcePreviewMode {
  const contentType = file.type.toLowerCase()
  const extension = getFileExtension(file.name)

  if (contentType.includes("pdf") || extension === ".pdf") {
    return "pdf"
  }

  if (
    contentType === "image/png" ||
    contentType === "image/jpeg" ||
    extension === ".png" ||
    extension === ".jpg" ||
    extension === ".jpeg"
  ) {
    return "image"
  }

  if (
    contentType.includes("wordprocessingml") ||
    extension === ".docx"
  ) {
    return "docx"
  }

  if (
    contentType.includes("spreadsheetml") ||
    extension === ".xlsx"
  ) {
    return "xlsx"
  }

  if (
    contentType.includes("presentationml") ||
    extension === ".pptx"
  ) {
    return "pptx"
  }

  return "embed"
}

export function isSupportedUploadFile(file: Pick<File, "name" | "type">): boolean {
  const contentType = file.type.toLowerCase()
  const extension = getFileExtension(file.name)

  if (
    SUPPORTED_UPLOAD_EXTENSIONS.includes(
      extension as (typeof SUPPORTED_UPLOAD_EXTENSIONS)[number]
    )
  ) {
    return true
  }

  return (
    contentType.includes("pdf") ||
    contentType === "image/png" ||
    contentType === "image/jpeg" ||
    contentType.includes("wordprocessingml") ||
    contentType.includes("spreadsheetml") ||
    contentType.includes("presentationml")
  )
}
