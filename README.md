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

- `apps/ai`는 현재 포함되어 있지만 compose 기본 서비스에는 넣지 않았다. 무거워서 로컬 필요 시 별도 실행하는 쪽이 맞다.
- `apps/mcp`도 현재 compose 기본 서비스에는 넣지 않았다. 로컬 도구 연동 시 별도 실행하면 된다.
- object storage는 local compose에서 `MinIO`를 사용하고, production에서는 Cloudflare R2로 바꿔 붙일 수 있다.
- 각 앱 repo 변경을 반영하려면 해당 submodule을 업데이트한 뒤 상위 monorepo에서 submodule pointer를 커밋해야 한다.
