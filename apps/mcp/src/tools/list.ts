import { z } from "zod";
import { listDocuments, ApiError } from "../client.js";

export const listDocumentsSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Number of documents to return (default: 20, max: 100)."),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of documents to skip for pagination (default: 0)."),
  filename: z
    .string()
    .optional()
    .describe("Filter documents by filename (optional)."),
});

export async function runListDocuments(
  args: z.infer<typeof listDocumentsSchema>,
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    const response = await listDocuments({
      limit: args.limit,
      offset: args.offset,
      filename: args.filename,
    });

    const result = {
      total: response.total,
      limit: response.limit,
      offset: response.offset,
      returned: response.items.length,
      has_more: response.offset + response.items.length < response.total,
      items: response.items.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        content_type: doc.contentType,
        created_at: doc.createdAt,
        updated_at: doc.updatedAt,
      })),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : `Unexpected error: ${String(err)}`;
    return { isError: true, content: [{ type: "text", text: message }] };
  }
}
