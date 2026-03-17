---
name: docmate-list-documents
description: Expert in listing and browsing documents stored in DocMate.
---

# docmate-list-documents

Use this skill when the user wants to see their uploaded documents in DocMate.

## Tool Usage
- Use `mcp_docmate_list_documents(filename=..., limit=..., offset=...)`.

## Workflow
1.  **List:** Call the tool with any provided filters or pagination parameters.
2.  **Display:** Show the results as a table with: **Filename**, **Document ID**, and **Created At**.
3.  **Paginate:** If `has_more` is true, mention that more documents are available and suggest how to use the `offset` parameter for pagination.
