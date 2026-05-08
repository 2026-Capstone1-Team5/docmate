FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_LINK_MODE=copy

WORKDIR /workspace/apps/api

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates poppler-utils \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

COPY apps/api/pyproject.toml apps/api/uv.lock ./
COPY packages/contracts-python /workspace/packages/contracts-python

RUN uv sync --frozen --no-dev

COPY apps/api/src ./src
COPY apps/api/migrations ./migrations
COPY apps/api/alembic.ini ./
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /workspace/apps/api/docker-entrypoint.sh

EXPOSE 8000

CMD ["/workspace/apps/api/docker-entrypoint.sh"]
