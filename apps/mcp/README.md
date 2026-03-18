# document-agent-mcp

MCP (Model Context Protocol) server for [DocMate](https://github.com/2026-Capstone1-Team5) — AI-powered document management.

Exposes three tools to Claude:

| Tool | Description |
|------|-------------|
| `upload_document` | Upload a local PDF and convert it to Markdown |
| `list_documents` | List all uploaded documents |
| `get_document_result` | Retrieve the full parsed Markdown of a document |

---

## Quick Start (Claude Code)

### 1. Get a DocMate API key

1. Make sure the DocMate backend is running.
2. Register at `http://localhost:3000/register` (or via the API).
3. Go to **API Keys** in the dashboard and create a new key. Copy it.

### 2. Add `.mcp.json` to your project

Create a `.mcp.json` file in the root of the project where you want to use the MCP server:

```json
{
  "mcpServers": {
    "docmate": {
      "command": "npx",
      "args": ["-y", "document-agent-mcp"],
      "env": {
        "DOCMATE_API_KEY": "your-api-key-here",
        "DOCUMENT_AGENT_API_BASE_URL": "http://127.0.0.1:8000"
      }
    }
  }
}
```

- `DOCMATE_API_KEY`: the key you created above (**required**)
- `DOCUMENT_AGENT_API_BASE_URL`: base URL of the running DocMate backend (default: `http://127.0.0.1:8000`)

### 3. Launch Claude Code

```bash
claude
```

Verify the MCP server is connected:

```
/mcp
```

You should see `docmate` listed with `upload_document`, `list_documents`, and `get_document_result`.

---

## Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "docmate": {
      "command": "npx",
      "args": ["-y", "document-agent-mcp"],
      "env": {
        "DOCMATE_API_KEY": "your-api-key-here",
        "DOCUMENT_AGENT_API_BASE_URL": "http://127.0.0.1:8000"
      }
    }
  }
}
```

Config file location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DOCMATE_API_KEY` | Yes | — | DocMate API key for authentication |
| `DOCUMENT_AGENT_API_BASE_URL` | No | `http://127.0.0.1:8000` | DocMate backend URL |

---

## Local Development

```bash
git clone https://github.com/2026-Capstone1-Team5/document-agent-mcp
cd document-agent-mcp
pnpm install
pnpm build

# Run directly
node dist/index.js
```

Copy `.env.example` to `.env` and fill in your values for local dev:

```bash
cp .env.example .env
```

```env
DOCMATE_API_KEY=<YOUR_API_KEY>
DOCUMENT_AGENT_API_BASE_URL=http://127.0.0.1:8000
```
