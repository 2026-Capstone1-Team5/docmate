from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

import server


class FakeRuntime:
    def __init__(self) -> None:
        self.initialized = False
        self.parse_calls = 0

    def ensure_ready(self) -> None:
        self.initialized = True

    @property
    def ready(self) -> bool:
        return self.initialized

    def parse_pdf(self, *, pdf_path: Path, output_dir: Path, language: str) -> dict:
        self.ensure_ready()
        self.parse_calls += 1
        assert pdf_path.exists()
        assert output_dir.parent.exists()
        return {
            "markdown": "# Parsed",
            "canonical_json": {
                "document": {
                    "source": "document_ai_service",
                    "filename": pdf_path.name,
                    "language": language,
                },
                "blocks": [{"type": "text", "text": "# Parsed"}],
            },
            "metadata": {
                "parse_mode": "normal",
                "outputs": {"markdown": "sample.md"},
            },
        }


def test_health_returns_service_name() -> None:
    client = TestClient(server.app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"service": "document-ai", "status": "ok"}


def test_ready_returns_not_ready_before_runtime_init() -> None:
    fake_runtime = FakeRuntime()
    server.app.dependency_overrides[server.get_runtime] = lambda: fake_runtime
    client = TestClient(server.app)

    try:
        response = client.get("/ready")

        assert response.status_code == 503
        assert response.json() == {"ready": False, "state": "runtime_not_initialized"}
    finally:
        server.app.dependency_overrides.clear()


def test_parse_initializes_runtime_once_and_returns_payload() -> None:
    fake_runtime = FakeRuntime()
    server.app.dependency_overrides[server.get_runtime] = lambda: fake_runtime
    client = TestClient(server.app)

    try:
        first = client.post(
            "/parse",
            files={"file": ("sample.pdf", b"%PDF-1.4\n%%EOF\n", "application/pdf")},
            data={"language": "en"},
        )
        second = client.post(
            "/parse",
            files={"file": ("sample.pdf", b"%PDF-1.4\n%%EOF\n", "application/pdf")},
            data={"language": "ko"},
        )

        assert first.status_code == 200
        assert first.json()["markdown"] == "# Parsed"
        assert first.json()["canonicalJson"]["document"]["source"] == "document_ai_service"
        assert second.status_code == 200
        assert second.json()["canonicalJson"]["document"]["language"] == "ko"
        assert client.get("/ready").json() == {"ready": True, "state": "runtime_initialized"}
        assert fake_runtime.initialized is True
        assert fake_runtime.parse_calls == 2
    finally:
        server.app.dependency_overrides.clear()
