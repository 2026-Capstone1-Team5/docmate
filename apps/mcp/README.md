# @qxinm/docmate-mcp

MCP (Model Context Protocol) server for [DocMate](https://github.com/2026-Capstone1-Team5/docmate) — AI-powered document management.

Published package:

- `@qxinm/docmate-mcp`

Exposes four tools to AI agents:

| Tool | Description |
|------|-------------|
| `upload_document` | Upload a local PDF and convert it to Markdown |
| `list_documents` | List all uploaded documents |
| `get_parse_job_status` | Check whether an async parse job is still running, succeeded, or failed |
| `get_document_result` | Retrieve the full parsed Markdown of a document |

---

## Quick Start

### Option 1: Install via Skills CLI (Recommended)

DocMate agent skills live in the monorepo root [`skills/`](https://github.com/2026-Capstone1-Team5/docmate/tree/main/skills). Install them with:

```bash
npx skills add 2026-Capstone1-Team5/docmate
```

This downloads the DocMate skills and configures them for your detected agents (Claude Code, Gemini CLI, Codex, Cursor, and 40+ more).

Then run setup to register the MCP server and provide your API key:

```bash
npm install -g @qxinm/docmate-mcp
docmate-mcp setup
```

### Option 2: Install via npm

```bash
npm install -g @qxinm/docmate-mcp
docmate-mcp setup
```

The setup command will:
- Prompt for your API key and backend URL
- Auto-detect installed agents (Claude Code, Gemini CLI, Codex)
- Register the MCP server with your agent automatically
- Install DocMate skills (slash commands)

Works on **Windows, macOS, and Linux**.

### Verify the connection

Launch your agent and run:

```
/mcp
```

You should see `docmate` listed with `upload_document`, `list_documents`, `get_parse_job_status`, and `get_document_result`.

---

## Setup options

```bash
# Install for a specific agent only
docmate-mcp setup --agent claude
docmate-mcp setup --agent gemini
docmate-mcp setup --agent codex

# Install for multiple agents
docmate-mcp setup --agent claude --agent gemini

# Install into a specific project directory instead of HOME
docmate-mcp setup --target ./my-project

# Show help
docmate-mcp setup --help
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
      "command": "docmate-mcp",
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

## Manual MCP setup (without `docmate-mcp setup`)

If you prefer to configure manually, create a `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "docmate": {
      "command": "docmate-mcp",
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
npm install -g @qxinm/docmate-mcp
claude mcp add --scope user docmate \
  -e DOCMATE_API_KEY=your-api-key-here \
  -e DOCUMENT_AGENT_API_BASE_URL=http://127.0.0.1:8000 \
  -- docmate-mcp
```

For Codex:

```bash
npm install -g @qxinm/docmate-mcp
codex mcp add docmate \
  --env DOCMATE_API_KEY=your-api-key-here \
  --env DOCUMENT_AGENT_API_BASE_URL=http://127.0.0.1:8000 \
  -- docmate-mcp
```

---

## Local Development

```bash
git clone https://github.com/2026-Capstone1-Team5/docmate
cd docmate/apps/mcp
pnpm install
pnpm run build:local

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

- run `pnpm build` (`tsc`) and `npm pack` on PRs and pushes (`npm pack` runs `prepack`, which syncs `skills/` before packing)
- publish to npm on `v*` tag pushes or manual workflow dispatch

Repository secret required:

- `NPM_TOKEN`

The token must have publish permission for the `@qxinm` scope.

Tag-based release example:

```bash
git tag mcp/v0.2.0
git push origin mcp/v0.2.0
```
