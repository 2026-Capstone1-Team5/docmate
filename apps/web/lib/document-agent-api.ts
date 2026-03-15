import { buildApiUrl, requestJson, requestVoid } from "@/lib/api-client";

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

export type DownloadFormat = "markdown" | "json";

const API_ROOT = "/api/documents";

export async function uploadDocument(
  file: File,
): Promise<DocumentParseResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<DocumentParseResponse>({
    apiRoot: API_ROOT,
    path: "/",
    init: {
      method: "POST",
      body: formData,
    },
    fallbackMessage: "API 요청에 실패했습니다.",
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
