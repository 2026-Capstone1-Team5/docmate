## MCP Server — `document-agent-mcp`

The MCP server exposes DocMate to Claude Code as three tools:
- `upload_document` — upload and parse a local PDF
- `list_documents` — list uploaded documents
- `get_document_result` — retrieve parsed markdown

### Setup

```bash
cd document-agent-mcp

# Install dependencies
pnpm install

# Build
pnpm build
```

### Create an API key

You need a DocMate API key so the MCP server can authenticate with the backend.

1. Make sure the backend is running.
2. Register an account at `http://localhost:3000/register` (or via the API).
3. Go to **API Keys** in the dashboard and create a new key. Copy it.

### Configure `.env`

API credentials are managed via a `.env` file. Copy the example and fill in your values:

```bash
cp .env.example .env
```

Then open `.env` and set your values:

```env
DOCMATE_API_KEY=<YOUR_API_KEY>
DOCUMENT_AGENT_API_BASE_URL=http://127.0.0.1:8000
```

- `DOCMATE_API_KEY`: the key you created above
- `DOCUMENT_AGENT_API_BASE_URL`: base URL of the running DocMate backend

> **Note:** `.env` is listed in `.gitignore` and will never be committed. Never share or commit this file.

### Run Claude Code

```bash
# Make sure you are inside document-agent-mcp
cd document-agent-mcp

# Launch Claude Code
claude
```

After launch, verify the MCP server and skills are connected:

```
/mcp     # confirm docmate tools are listed
/skills  # confirm docmate skills are available
```

Skills can be triggered by the AI itself when needed, or they can be used at the user's explicit request.

---