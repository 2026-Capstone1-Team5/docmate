import { z } from "zod";
import { getParseJob, ApiError } from "../client.js";

export const getParseJobSchema = z.object({
  job_id: z
    .string()
    .uuid("job_id must be a valid UUID."),
});

export async function runGetParseJob(
  args: z.infer<typeof getParseJobSchema>,
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    const response = await getParseJob(args.job_id);
    const { job } = response;

    const result: Record<string, unknown> = {
      job_id: job.id,
      filename: job.filename,
      content_type: job.contentType,
      parser_backend: job.parserBackend,
      status: job.status,
      document_id: job.documentId,
      error_code: job.errorCode,
      error_message: job.errorMessage,
      created_at: job.createdAt,
      updated_at: job.updatedAt,
      started_at: job.startedAt,
      finished_at: job.finishedAt,
    };

    if (job.status === "succeeded" && job.documentId) {
      result.message = `Parsing finished. Use get_document_result("${job.documentId}") to retrieve the Markdown output.`;
    } else if (job.status === "failed") {
      result.message = "Parsing failed.";
    } else {
      result.message = "Parsing is still in progress.";
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
