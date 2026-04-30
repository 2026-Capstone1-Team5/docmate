# DocMate Architecture

This document summarizes the `DocMate` architecture on the `main` branch in a C4-style format.

## 1. System Context

```mermaid
flowchart LR
    user[End User]
    agent[AI Agent or MCP Client]

    docmate[DocMate]

    postgres[(Postgres)]
    redis[(Redis)]
    storage[(MinIO or Cloudflare R2)]
    ai[Document AI / MinerU Pipeline]

    user -->|upload docs, review results| docmate
    agent -->|upload docs, poll jobs, fetch results| docmate

    docmate -->|store metadata| postgres
    docmate -->|queue jobs, heartbeat| redis
    docmate -->|store source and result artifacts| storage
    docmate -->|invoke parsing pipeline| ai
```

Description:
- Human users upload documents and review parsing results through the web UI.
- AI agents access the same system through MCP.
- The core responsibility of the system is to transform documents into Markdown and structured JSON artifacts that can be retrieved later.

## 2. Container Diagram

```mermaid
flowchart TB
    user[End User]
    agent[AI Agent or MCP Client]

    subgraph docmate[DocMate]
        web[Web App\nNext.js]
        api[API\nFastAPI]
        worker[Worker\nPython]
        mcp[MCP Server\nTypeScript]
        ai[Document AI\nPython scripts + MinerU]
    end

    postgres[(Postgres)]
    redis[(Redis)]
    storage[(MinIO or R2)]

    user --> web
    agent --> mcp

    web -->|HTTP via route handlers| api
    mcp -->|HTTP tools| api

    api --> postgres
    api --> redis
    api --> storage

    worker --> redis
    worker --> postgres
    worker --> storage
    worker --> ai
```

Description:
- `apps/web` provides the human-facing UI.
- `apps/api` handles authentication, documents, parse jobs, and worker status.
- Worker logic runs as a separate execution path for asynchronous parsing.
- `apps/mcp` exposes an agent-facing tool surface.
- `apps/ai` contains the actual document parsing pipeline.

## 3. API Component Diagram

```mermaid
flowchart TB
    main[API Main]

    authRouter[Auth Router]
    docsRouter[Documents Router]
    jobsRouter[Parse Jobs Router]
    workerStatus[Worker Status Endpoint]

    authService[Auth Service]
    docService[Document Service]
    jobService[Parse Job Service]

    security[Token and API Key Security]
    queue[Queue Backend]
    objectStore[Object Storage Backend]

    main --> authRouter
    main --> docsRouter
    main --> jobsRouter
    main --> workerStatus

    authRouter --> authService
    authRouter --> security

    docsRouter --> docService
    docsRouter --> jobService
    docsRouter --> objectStore
    docsRouter --> security

    jobsRouter --> jobService
    jobsRouter --> queue
    jobsRouter --> security

    workerStatus --> queue
```

Description:
- The API is primarily an orchestration layer rather than the parsing engine itself.
- Upload requests do not return parse results immediately; they create parse jobs.
- Authentication supports both bearer tokens and API keys.

## 4. Worker and Parsing Pipeline Component Diagram

```mermaid
flowchart TB
    queue[Parse Job Queue]
    runner[Worker Runner]
    store[Object Storage]
    db[(Postgres)]

    markitdown[MarkItDown Parser]
    pdftotext[pdftotext Parser]
    docai[DocumentAI Parser]

    script[parse_document.py]
    inspect[PDF Inspection]
    raster[Rasterize Fallback]
    mineru[MinerU]
    output[Markdown plus meta.json]

    queue --> runner
    store -->|source bytes| runner

    runner --> markitdown
    runner --> pdftotext
    runner --> docai

    docai --> script
    script --> inspect
    inspect --> raster
    inspect --> mineru
    raster --> mineru
    mineru --> output

    runner -->|save result metadata| db
    runner -->|save markdown/json artifacts| store
```

Description:
- The worker pulls jobs from the queue and selects a parser backend.
- The `document_ai` path invokes `parse_document.py`.
- That script inspects the PDF and may rasterize it before running MinerU.
- The final Markdown and structured outputs are then stored.

## 5. Web and MCP Access Diagram

```mermaid
flowchart LR
    user[End User]
    agent[AI Agent]

    subgraph webside[Web Surface]
        ui[Dashboard UI\nupload, documents, result viewer]
        bff[Next Route Handlers / BFF]
    end

    subgraph agentside[Agent Surface]
        mcp[MCP Tools\nupload_document\nlist_documents\nget_parse_job_status\nget_document_result]
    end

    api[DocMate API]

    user --> ui
    ui --> bff
    bff --> api

    agent --> mcp
    mcp --> api
```

Description:
- The web application is the human-facing interface.
- MCP is the agent-facing interface.
- Both surfaces call the same API and consume the same document artifacts.

## Summary

`DocMate` can be understood as three connected layers:

- a human-facing web interface
- an agent-facing MCP interface
- a shared API, worker, storage, and parsing pipeline

The architectural center of gravity is closer to asynchronous parse job orchestration than simple document storage.
