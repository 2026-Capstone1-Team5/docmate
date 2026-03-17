---
name: docmate-list-documents
description: This skill should be used when the user asks to "list documents", "show uploaded files", "what documents are in DocMate", "show document list", or wants to browse available documents.
---

List documents uploaded to DocMate.

Use the `mcp__docmate__list_documents` tool.

If arguments are provided via $ARGUMENTS, interpret them as follows:
- A number is treated as the `limit` (e.g. `/list-documents 5` → limit: 5)
- A string is treated as a `filename` filter (e.g. `/list-documents report` → filename: "report")

Display the results as a table with columns: filename, document_id, and created_at.
If `has_more` is true, mention that more documents are available and suggest paginating with an offset.
