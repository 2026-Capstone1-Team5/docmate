# Document Agent Monorepo

로컬 실행과 배포 패키징을 단순화하기 위한 monorepo 작업 디렉터리다.
앱 코드는 `apps/*` 아래에 실제 upstream Git 저장소를 submodule로 연결한다.

## Layout

```text
document-agent/
  apps/
    api/   # submodule
    web/   # submodule
    mcp/   # submodule
    ai/    # submodule
  infra/
    docker-compose.yml
    .env.example
```

## Clone

```bash
git clone --recurse-submodules <repo-url>
```

이미 clone 했다면:

```bash
git submodule update --init --recursive
```

## Local Run

```bash
cd infra
cp .env.example .env
docker-compose up -d --build
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

- `apps/ai`는 로컬 compose에서 `document_agent-api` 서비스의 파서 엔진으로 주입됩니다.
  - `api`/`worker`에 `../apps/ai:/app/apps/ai:ro`가 마운트됩니다.
  - 기본적으로 `document_ai`를 포함한 파서 백엔드가 활성화됩니다(`ENABLED_PARSER_BACKENDS=document_ai,...`).
- 운영 환경에서는 `DOCUMENT_AI_*` 플래그를 끄면 `document_ai`가 비활성화되어 문서 선택 UI에서 노출되지 않습니다.
- `apps/mcp`도 현재 compose 기본 서비스에는 넣지 않았다. 로컬 도구 연동 시 별도 실행하면 된다.
- object storage는 local compose에서 `MinIO`를 사용하고, production에서는 Cloudflare R2로 바꿔 붙일 수 있다.
- 각 앱 repo 변경을 반영하려면 해당 submodule을 업데이트한 뒤 상위 monorepo에서 submodule pointer를 커밋해야 한다.
