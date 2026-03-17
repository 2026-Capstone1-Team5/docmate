---
name: docmate-upload-document
description: Expert in uploading and parsing PDF documents using DocMate.
---

# docmate-upload-document

Use this skill when the user wants to upload a local PDF file and convert it to Markdown.

## Tool Usage
- Use `mcp_docmate_upload_document(file_path=...)` with the provided file path.

## Workflow
1.  **Validate Path:** Verify the file path exists before calling the tool.
2.  **Upload:** Use the tool and capture the response.
3.  **Display:** Show the `document_id` and the Markdown preview of the parsed result.
4.  **Follow-up:** If `is_result_ready` is false, inform the user that processing is ongoing and they can use `docmate-get-document-result` to retrieve the full result later.
