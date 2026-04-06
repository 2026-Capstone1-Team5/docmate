# DocMate Monorepo

`docmate`는 Document AI 서비스용 통합 monorepo다.
이 저장소는 더 이상 submodule wrapper가 아니라, 각 앱의 실제 파일과 Git 히스토리를 `apps/*` 아래에 직접 포함한다.

## Layout

```text
docmate/
  apps/
    api/   # document-agent-api history imported directly
    web/   # document-agent-web history imported directly
    mcp/   # document-agent-mcp history imported directly
    ai/    # document-ai history imported directly
  infra/
    docker-compose.yml
    .env.example
```

## Clone

```bash
git clone <repo-url>
cd docmate
```

submodule 초기화는 필요하지 않다.

## History Preservation

이 monorepo는 기존 저장소의 커밋 이력과 브랜치를 보존한 채 구성됐다.

- 루트 workspace history: `document-agent/*`
- Web app branches: `web/*`
- API app branches: `api/*`
- MCP app branches: `mcp/*`
- Document AI branches: `ai/*`
- imported tags are prefixed by source, for example `mcp/v0.1.6`

대표 통합 브랜치는 `main`이다.

## Local Run

```bash
cd infra
cp .env.example .env
docker compose up -d --build
```

기본 구성은 아래 서비스를 함께 띄운다.

- `postgres`
- `redis`
- `minio`
- `api`
- `worker`
- `web`

## Endpoints

- Web: `http://127.0.0.1:3001`
- API: `http://127.0.0.1:8000`
- API health: `http://127.0.0.1:8000/healthz`
- MinIO Console: `http://127.0.0.1:9001`

## Notes

- `apps/ai`는 로컬 compose에서 `document_agent-api` 서비스의 파서 엔진으로 주입된다.
  - `api`/`worker`에 `../apps/ai:/app/apps/ai:ro`가 마운트된다.
  - 기본적으로 `document_ai`를 포함한 파서 백엔드가 활성화된다 (`ENABLED_PARSER_BACKENDS=document_ai,...`).
- 운영 환경에서는 `DOCUMENT_AI_*` 플래그를 끄면 `document_ai`가 비활성화되어 문서 선택 UI에서 노출되지 않는다.
- `apps/mcp`는 compose 기본 서비스에 포함되지 않으므로 로컬 도구 연동 시 별도 실행하면 된다.
- object storage는 local compose에서 `MinIO`를 사용하고, production에서는 Cloudflare R2로 교체할 수 있다.
