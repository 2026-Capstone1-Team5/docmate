---
name: docmate-get-document-result
description: This skill should be used when the user asks to "get document result", "show parsed result", "retrieve document content", "read parsed markdown", or provides a document_id to fetch.
---

Retrieve the parsed markdown result for a specific document.

Use the `mcp__docmate__get_document_result` tool with the document_id provided in the arguments: $ARGUMENTS

Display the full markdown content of the parsed document.
If no document_id is provided, use `mcp__docmate__list_documents` first to show available documents and ask the user to pick one.
