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

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown> | null;
  };
};

export type DownloadFormat = "markdown" | "json";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_DOCUMENT_AGENT_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");
const API_ROOT = API_BASE_URL.endsWith("/api/v1")
  ? API_BASE_URL
  : `${API_BASE_URL}/api/v1`;

function buildUrl(path: string, query?: URLSearchParams): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = `${API_ROOT}${normalizedPath}`;
  if (!query) {
    return base;
  }
  const queryString = query.toString();
  return queryString ? `${base}?${queryString}` : base;
}

async function buildError(response: Response): Promise<Error> {
  let message = `API 요청에 실패했습니다. (${response.status})`;
  try {
    const body = (await response.json()) as ApiErrorResponse;
    if (
      typeof body.error?.message === "string" &&
      body.error.message.trim() !== ""
    ) {
      message = body.error.message;
    }
  } catch {
    // Ignore parse failure and fallback to the default message.
  }
  return new Error(message);
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  query?: URLSearchParams,
): Promise<T> {
  const response = await fetch(buildUrl(path, query), init);
  if (!response.ok) {
    throw await buildError(response);
  }
  return (await response.json()) as T;
}

export async function uploadDocument(
  file: File,
): Promise<DocumentParseResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<DocumentParseResponse>("/documents", {
    method: "POST",
    body: formData,
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

  return requestJson<DocumentListResponse>(
    "/documents",
    {
      method: "GET",
    },
    query,
  );
}

export async function getDocument(
  documentId: string,
): Promise<DocumentResponse> {
  return requestJson<DocumentResponse>(`/documents/${documentId}`, {
    method: "GET",
  });
}

export async function getDocumentResult(
  documentId: string,
): Promise<DocumentParseResponse> {
  return requestJson<DocumentParseResponse>(`/documents/${documentId}/result`, {
    method: "GET",
  });
}

export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(buildUrl(`/documents/${documentId}`), {
    method: "DELETE",
  });
  if (!response.ok) {
    throw await buildError(response);
  }
}

export function getDownloadUrl(
  documentId: string,
  format: DownloadFormat,
): string {
  const query = new URLSearchParams({ format });
  return buildUrl(`/documents/${documentId}/download`, query);
}
