#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  uploadDocumentSchema,
  runUploadDocument,
} from "./tools/upload.js";
import {
  listDocumentsSchema,
  runListDocuments,
} from "./tools/list.js";
import {
  getDocumentResultSchema,
  runGetDocumentResult,
} from "./tools/result.js";

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
