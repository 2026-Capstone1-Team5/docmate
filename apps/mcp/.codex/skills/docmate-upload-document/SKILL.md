---
name: "docmate-upload-document"
description: "Use when the user asks to upload a PDF, parse a local file in DocMate, or add a document by path."
---

# DocMate Upload Document

Upload a local PDF file to DocMate and parse it.

## Tool Usage

- Use `mcp__docmate__upload_document(file_path=...)`.

## Workflow

1. Validate that the provided file path exists.
2. Call `mcp__docmate__upload_document` with the file path.
3. Show `document_id` and the Markdown preview from the response.
4. If `is_result_ready` is `false`, tell the user processing is still in progress and use `docmate-get-document-result` to retrieve the full result later.
