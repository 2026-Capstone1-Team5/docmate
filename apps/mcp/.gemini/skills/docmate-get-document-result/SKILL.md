---
name: docmate-get-document-result
description: Expert in retrieving full parsed Markdown results from DocMate.
---

# docmate-get-document-result

Use this skill when you need to retrieve the complete parsed Markdown content of a document that has already been uploaded.

## Tool Usage
- Use `mcp_docmate_get_document_result(document_id=...)`.

## Workflow
1.  **Retrieve ID:** If the user hasn't provided a `document_id`, use `docmate-list-documents` first to show available documents and ask the user to select one.
2.  **Get Result:** Call the tool with the `document_id`.
3.  **Display:** Show the full Markdown content of the parsed document.
4.  **Options:** Optionally set `include_json=true` if the user specifically requests raw JSON data.
