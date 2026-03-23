# document-agent-mcp

MCP (Model Context Protocol) server for [DocMate](https://github.com/2026-Capstone1-Team5) — AI-powered document management.

Published package:

- `@qxinm/document-agent-mcp`

Exposes four tools to AI agents:

| Tool | Description |
|------|-------------|
| `upload_document` | Upload a local PDF and convert it to Markdown |
| `list_documents` | List all uploaded documents |
| `get_parse_job_status` | Check whether an async parse job is still running, succeeded, or failed |
| `get_document_result` | Retrieve the full parsed Markdown of a document |

---

## Quick Start

### 1. Get a DocMate API key

1. Make sure the DocMate backend is running.
2. Register at `http://localhost:3000/register` (or via the API).
3. Go to **API Keys** in the dashboard and create a new key. Copy it.

### 2. Install and run setup

```bash
npm install -g @qxinm/document-agent-mcp
document-agent-mcp setup
```

The setup command will:
- Prompt for your API key and backend URL
- Auto-detect installed agents (Claude Code, Gemini CLI, Codex)
- Register the MCP server with your agent automatically
- Install DocMate skills (slash commands)

Works on **Windows, macOS, and Linux**.

### 3. Verify the connection

Launch your agent and run:

```
/mcp
```

You should see `docmate` listed with `upload_document`, `list_documents`, `get_parse_job_status`, and `get_document_result`.

---

## Setup options

```bash
# Install for a specific agent only
document-agent-mcp setup --agent claude
document-agent-mcp setup --agent gemini
document-agent-mcp setup --agent codex

# Install for multiple agents
document-agent-mcp setup --agent claude --agent gemini

# Install into a specific project directory instead of HOME
document-agent-mcp setup --target ./my-project

# Show help
document-agent-mcp setup --help
```

### Installed locations

| Agent | Skills path | MCP config |
|-------|-------------|------------|
| Claude Code | `~/.claude/skills/` | registered via `claude mcp add --scope user` |
| Gemini CLI | `~/.gemini/skills/` | `~/.gemini/.mcp.json` |
| OpenAI Codex | `~/.codex/skills/` | registered via `codex mcp add` or `~/.codex/config.toml` |

Agent detection is automatic — setup checks which CLIs are available on your `PATH`.
If none are detected, pass `--agent <name>` explicitly.
When `--target <path>` is used, skills and agent config files are written under that directory instead of `HOME`.

---

## Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "docmate": {
      "command": "document-agent-mcp",
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

## Manual MCP setup (without `skills.sh`)

If you prefer to configure manually, create a `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "docmate": {
      "command": "document-agent-mcp",
      "env": {
        "DOCMATE_API_KEY": "your-api-key-here",
        "DOCUMENT_AGENT_API_BASE_URL": "http://127.0.0.1:8000"
      }
    }
  }
}
```

Or register globally via CLI:

```bash
npm install -g @qxinm/document-agent-mcp
claude mcp add --scope user docmate \
  -e DOCMATE_API_KEY=your-api-key-here \
  -e DOCUMENT_AGENT_API_BASE_URL=http://127.0.0.1:8000 \
  -- document-agent-mcp
```

For Codex:

```bash
npm install -g @qxinm/document-agent-mcp
codex mcp add docmate \
  --env DOCMATE_API_KEY=your-api-key-here \
  --env DOCUMENT_AGENT_API_BASE_URL=http://127.0.0.1:8000 \
  -- document-agent-mcp
```

---

## Local Development

```bash
git clone https://github.com/2026-Capstone1-Team5/document-agent-mcp
cd document-agent-mcp
pnpm install
pnpm build

# Run directly
node dist/index.js

# Run setup directly from the repo
node dist/index.js setup
```

Copy `.env.example` to `.env` and fill in your values for local dev:

```bash
cp .env.example .env
```

```env
DOCMATE_API_KEY=<YOUR_API_KEY>
DOCUMENT_AGENT_API_BASE_URL=http://127.0.0.1:8000
```

---

## npm Release

GitHub Actions is configured to:

- run `pnpm build` and `npm pack` on PRs and pushes
- publish to npm on `v*` tag pushes or manual workflow dispatch

Repository secret required:

- `NPM_TOKEN`

The token must have publish permission for the `@qxinm` scope.

Tag-based release example:

```bash
git tag v0.1.6
git push origin v0.1.6
```
