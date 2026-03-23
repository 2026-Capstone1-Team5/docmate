import { config } from "dotenv";

config({ override: false }); // process.cwd()/.env 에서 로드, 이미 주입된 env는 덮어쓰지 않음

// 모듈 로드 시점에 즉시 환경 변수 검증
const API_KEY = (() => {
  const key = process.env.DOCMATE_API_KEY;
  if (!key) throw new Error("DOCMATE_API_KEY 환경 변수가 설정되지 않았습니다.");
  return key;
})();

const BASE_URL =
  process.env.DOCUMENT_AGENT_API_BASE_URL ?? "http://127.0.0.1:8000";

// ── 응답 스키마 타입 ──────────────────────────────────────────────────────────

export interface DocumentSummary {
  id: string;
  filename: string;
  contentType: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParseResult {
  markdown: string;
  canonicalJson: Record<string, unknown>;
}

export interface DocumentParseResponse {
  document: DocumentSummary;
  result: ParseResult;
}

export interface DocumentListResponse {
  items: DocumentSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface ParseJob {
  id: string;
  filename: string;
  contentType: string;
  parserBackend: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  documentId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface ParseJobResponse {
  job: ParseJob;
}

// ── 공통 에러 핸들러 ──────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UploadPendingError extends ApiError {
  constructor(
    public readonly jobId: string,
    message = "파싱이 아직 완료되지 않았습니다.",
  ) {
    super(202, message);
    this.name = "UploadPendingError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;

  const body = await res.text().catch(() => "");
  switch (res.status) {
    case 401:
      throw new ApiError(401, "API Key가 유효하지 않습니다. DOCMATE_API_KEY를 확인하세요.");
    case 403:
      throw new ApiError(403, "이 리소스에 접근 권한이 없습니다.");
    case 404:
      throw new ApiError(404, "문서를 찾을 수 없습니다. document_id를 확인하세요.");
    case 422:
      throw new ApiError(422, `요청 형식 오류: ${body}`);
    case 500:
      throw new ApiError(500, "서버 내부 오류입니다. 잠시 후 다시 시도하세요.");
    default:
      throw new ApiError(res.status, `API 오류 (${res.status}): ${body}`);
  }
}

function defaultHeaders(): Record<string, string> {
  return { "X-API-Key": API_KEY };
}

// ── API 함수 ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 90; // 최대 3분 대기

export async function uploadDocument(
  fileBuffer: Buffer,
  filename: string,
): Promise<DocumentParseResponse> {
  // ── 1. 업로드 → 파싱 잡 생성 (202) ────────────────────────────────────────
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(fileBuffer)], { type: "application/octet-stream" }),
    filename,
  );

  const uploadRes = await fetch(`${BASE_URL}/api/v1/documents`, {
    method: "POST",
    headers: defaultHeaders(),
    body: formData,
    signal: AbortSignal.timeout(30_000),
  });

  const { job } = await handleResponse<ParseJobResponse>(uploadRes);

  // ── 2. 파싱 완료까지 폴링 ──────────────────────────────────────────────────
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const pollRes = await fetch(`${BASE_URL}/api/v1/parse-jobs/${job.id}`, {
      headers: defaultHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    const { job: updated } = await handleResponse<ParseJobResponse>(pollRes);

    if (updated.status === "succeeded" && updated.documentId) {
      return getDocumentResult(updated.documentId);
    }
    if (updated.status === "failed") {
      throw new ApiError(500, updated.errorMessage ?? "파싱 실패");
    }
  }

  throw new UploadPendingError(
    job.id,
    "파싱이 진행 중입니다. parse job 상태를 확인한 뒤 결과를 다시 조회하세요.",
  );
}

export async function getParseJob(
  jobId: string,
): Promise<ParseJobResponse> {
  const res = await fetch(
    `${BASE_URL}/api/v1/parse-jobs/${jobId}`,
    {
      headers: defaultHeaders(),
      signal: AbortSignal.timeout(30_000),
    },
  );

  return handleResponse<ParseJobResponse>(res);
}

export async function listDocuments(params: {
  limit?: number;
  offset?: number;
  filename?: string;
}): Promise<DocumentListResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  if (params.filename) query.set("filename", params.filename);

  const url = `${BASE_URL}/api/v1/documents${query.size ? `?${query}` : ""}`;
  const res = await fetch(url, {
    headers: defaultHeaders(),
    signal: AbortSignal.timeout(30_000),
  });

  return handleResponse<DocumentListResponse>(res);
}

export async function getDocumentResult(
  documentId: string,
): Promise<DocumentParseResponse> {
  const res = await fetch(
    `${BASE_URL}/api/v1/documents/${documentId}/result`,
    {
      headers: defaultHeaders(),
      signal: AbortSignal.timeout(30_000),
    },
  );

  return handleResponse<DocumentParseResponse>(res);
}
