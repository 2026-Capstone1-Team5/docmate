---
name: docmate-list-documents
description: Use when the user asks to list documents, show uploaded files, browse available documents in DocMate, or search/filter documents.
---

List documents uploaded to DocMate.

## Tool Usage

- Use `mcp__docmate__list_documents`.
- Supported parameters: `filename`, `limit`, `offset`.

## Argument Handling

- If a numeric argument is provided, treat it as `limit`.
- If a text argument is provided, treat it as a `filename` filter.

## Workflow

1. Call `mcp__docmate__list_documents` with any provided filters/pagination.
2. Display results as a table with `Filename`, `Document ID`, and `Created At`.
3. If `has_more` is `true`, mention that more documents are available and suggest paginating with `offset`.
