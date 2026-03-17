import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { uploadDocument, ApiError } from "../client.js";

export const uploadDocumentSchema = z.object({
  file_path: z.string().min(1, "file_path is required."),
});

// API 명세에 파일 크기 제한 없음 — 아래 값은 임의 설정값 (서버 설정에 따라 조정 필요)
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

function extractPreview(markdown: string): string {
  if (!markdown) return "";
  // 첫 빈 줄(\n\n) 이전까지 첫 단락 추출
  const firstBlank = markdown.indexOf("\n\n");
  if (firstBlank !== -1) return markdown.slice(0, firstBlank);
  // fallback: 단락 구분 없는 경우 300자
  return markdown.slice(0, 300);
}

export async function runUploadDocument(
  args: z.infer<typeof uploadDocumentSchema>,
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  const { file_path } = args;

  // ── 파일 검증 (HTTP 호출 전) ────────────────────────────────────────────────
  if (!fs.existsSync(file_path)) {
    return {
      isError: true,
      content: [{ type: "text", text: `File not found: ${file_path}` }],
    };
  }

  try {
    fs.accessSync(file_path, fs.constants.R_OK);
  } catch {
    return {
      isError: true,
      content: [{ type: "text", text: `Permission denied: cannot read file at ${file_path}` }],
    };
  }

  if (path.extname(file_path).toLowerCase() !== ".pdf") {
    return {
      isError: true,
      content: [{ type: "text", text: "Only PDF files can be uploaded." }],
    };
  }

  const stat = fs.statSync(file_path);
  if (stat.size > MAX_FILE_SIZE_BYTES) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `File size (${(stat.size / 1024 / 1024).toFixed(1)} MB) exceeds the 50 MB limit.`,
        },
      ],
    };
  }

  // ── 업로드 ──────────────────────────────────────────────────────────────────
  try {
    const fileBuffer = fs.readFileSync(file_path);
    const filename = path.basename(file_path);
    const response = await uploadDocument(fileBuffer, filename);

    // API는 동기 설계이므로 result.markdown이 비어 있으면 파싱 미완료로 판단
    const isResultReady = response.result.markdown !== "";

    const result: Record<string, unknown> = {
      document_id: response.document.id,
      filename: response.document.filename,
      is_result_ready: isResultReady,
      created_at: response.document.createdAt,
    };

    if (isResultReady) {
      result.markdown_preview = extractPreview(response.result.markdown);
      result.message = "Document parsed successfully.";
    } else {
      result.markdown_preview = null;
      result.message = `Parsing is not yet complete. Retrieve the result later with get_document_result("${response.document.id}").`;
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : `Unexpected error: ${String(err)}`;
    return { isError: true, content: [{ type: "text", text: message }] };
  }
}
