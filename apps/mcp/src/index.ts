#!/usr/bin/env node

// ── Setup subcommand (must run before any tool imports that validate env) ─────
if (process.argv[2] === "setup") {
  const { runSetup } = await import("./setup.js");
  await runSetup(process.argv.slice(3));
  process.exit(0);
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const { uploadDocumentSchema, runUploadDocument } = await import("./tools/upload.js");
const { listDocumentsSchema, runListDocuments } = await import("./tools/list.js");
const { getDocumentResultSchema, runGetDocumentResult } = await import("./tools/result.js");
const { getParseJobSchema, runGetParseJob } = await import("./tools/parse-job.js");

const server = new McpServer({
  name: "docmate",
  version: "1.0.0",
});

server.registerTool(
  "upload_document",
  {
    description:
      "Upload a PDF file from your computer and convert it to Markdown. " +
      "Provide the file path to upload it and receive a preview of the parsed content.",
    inputSchema: uploadDocumentSchema,
  },
  async (args) => runUploadDocument(args),
);

server.registerTool(
  "list_documents",
  {
    description:
      "Browse all documents you have uploaded to DocMate, along with their filenames and upload dates.",
    inputSchema: listDocumentsSchema,
  },
  async (args) => runListDocuments(args),
);

server.registerTool(
  "get_parse_job_status",
  {
    description:
      "Check the status of an uploaded parse job. " +
      "Use this when upload_document reports that parsing is still in progress.",
    inputSchema: getParseJobSchema,
  },
  async (args) => runGetParseJob(args),
);

server.registerTool(
  "get_document_result",
  {
    description:
      "Retrieve the full Markdown content of a parsed document. " +
      "Use this when you need the complete content beyond the preview.",
    inputSchema: getDocumentResultSchema,
  },
  async (args) => runGetDocumentResult(args),
);

const transport = new StdioServerTransport();
await server.connect(transport);
