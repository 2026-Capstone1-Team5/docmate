---
name: docmate-get-document-result
description: Use when the user asks to get document result, show parsed result, retrieve document content, read parsed markdown, or provides a document_id to fetch.
---

Retrieve the full parsed result for a specific DocMate document.

## Tool Usage

- Use `mcp__docmate__get_document_result`.
- Required parameter: `document_id`.
- Optional parameter: `include_json` when raw structured output is requested.

## Workflow

1. If no `document_id` is provided, call `mcp__docmate__list_documents` first and ask the user to choose one.
2. Call `mcp__docmate__get_document_result(document_id=...)`.
3. Display the full parsed Markdown content.
4. If requested, call with `include_json=true` and provide the JSON output.
