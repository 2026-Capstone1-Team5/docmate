import { z } from "zod";
import { getDocumentResult, ApiError } from "../client.js";

export const getDocumentResultSchema = z.object({
  document_id: z
    .string()
    .uuid("document_id must be a valid UUID."),
  include_json: z
    .boolean()
    .default(false)
    .describe(
      "Set to true to include the full structured JSON output. " +
      "Only use when you need the raw JSON data. " +
      "Defaults to false (Markdown only).",
    ),
});

export async function runGetDocumentResult(
  args: z.infer<typeof getDocumentResultSchema>,
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    const response = await getDocumentResult(args.document_id);

    const result: Record<string, unknown> = {
      document_id: response.document.id,
      filename: response.document.filename,
      updated_at: response.document.updatedAt,
      markdown: response.result.markdown,
    };

    if (args.include_json) {
      result.canonical_json = response.result.canonicalJson;
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
