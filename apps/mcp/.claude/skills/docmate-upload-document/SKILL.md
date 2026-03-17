---
name: docmate-upload-document
description: This skill should be used when the user asks to "upload a document", "upload a PDF", "parse a PDF", "add a file to DocMate", or provides a file path to upload.
---

Upload a local PDF file to DocMate and parse it.

Use the `mcp__docmate__upload_document` tool with the file path provided in the arguments: $ARGUMENTS

After uploading, show the document_id and the markdown preview of the parsed result.
If `is_result_ready` is false, follow up with `mcp__docmate__get_document_result` to retrieve the full result.
