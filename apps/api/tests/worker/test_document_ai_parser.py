from __future__ import annotations

import json
import subprocess
from pathlib import Path
from urllib.error import HTTPError, URLError

import pytest

from src.worker.parser import DocumentAIParser, WorkerParseError


class FakeHTTPResponse:
    def __init__(self, *, payload: dict, status: int = 200) -> None:
        self.payload = payload
        self.status = status

    def __enter__(self) -> "FakeHTTPResponse":
        return self

    def __exit__(self, exc_type, exc, traceback) -> None:
        return None

    def read(self) -> bytes:
        return json.dumps(self.payload).encode()


def test_document_ai_parser_uses_service_when_configured(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    input_path = tmp_path / "sample.pdf"
    input_path.write_bytes(b"%PDF-1.4\n%%EOF\n")
    calls = []

    def fake_urlopen(request, timeout: int) -> FakeHTTPResponse:
        calls.append((request.full_url, request.data, request.headers, timeout))
        return FakeHTTPResponse(
            payload={
                "markdown": "# Parsed",
                "canonicalJson": {
                    "document": {"source": "document_ai_service", "filename": "sample.pdf"},
                    "blocks": [{"type": "text", "text": "# Parsed"}],
                },
            },
        )

    monkeypatch.setattr("src.worker.parser.urlopen", fake_urlopen)
    parser = DocumentAIParser(
        script_path="/missing/script.py",
        timeout_seconds=123,
        service_url="http://127.0.0.1:8001/",
        service_timeout_seconds=45,
    )

    parsed = parser.parse(input_path=input_path, output_dir=tmp_path / "out")

    assert parsed.markdown == "# Parsed"
    assert parsed.canonical_json["document"]["source"] == "document_ai_service"
    assert calls[0][0] == "http://127.0.0.1:8001/parse"
    assert b'name="language"' in calls[0][1]
    assert b"en" in calls[0][1]
    assert calls[0][3] == 45


def test_document_ai_parser_falls_back_to_subprocess_when_service_fails(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    script_path = tmp_path / "parse_document.py"
    script_path.write_text("# parser script placeholder")
    input_path = tmp_path / "sample.pdf"
    input_path.write_bytes(b"%PDF-1.4\n%%EOF\n")

    def fake_urlopen(*args, **kwargs) -> FakeHTTPResponse:
        raise URLError("not ready")

    def fake_run(*args, **kwargs) -> subprocess.CompletedProcess:
        output_dir = Path(args[0][3])
        output_dir.mkdir(parents=True, exist_ok=True)
        markdown = output_dir / "selected.md"
        markdown.write_text("# Fallback")
        (output_dir / "meta.json").write_text(
            json.dumps({"parse_mode": "normal", "outputs": {"selected_markdown": "selected.md"}})
        )
        return subprocess.CompletedProcess(args=args[0], returncode=0, stdout="", stderr="")

    monkeypatch.setattr("src.worker.parser.urlopen", fake_urlopen)
    monkeypatch.setattr("src.worker.parser.subprocess.run", fake_run)
    parser = DocumentAIParser(
        script_path=str(script_path),
        timeout_seconds=123,
        service_url="http://127.0.0.1:8001",
        service_timeout_seconds=45,
    )

    parsed = parser.parse(input_path=input_path, output_dir=tmp_path / "out")

    assert parsed.markdown == "# Fallback"
    assert parsed.canonical_json["document"]["source"] == "document_ai"


def test_document_ai_parser_raises_when_service_payload_is_invalid(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    input_path = tmp_path / "sample.pdf"
    input_path.write_bytes(b"%PDF-1.4\n%%EOF\n")

    def fake_urlopen(*args, **kwargs) -> FakeHTTPResponse:
        return FakeHTTPResponse(payload={"markdown": ""})

    monkeypatch.setattr("src.worker.parser.urlopen", fake_urlopen)
    parser = DocumentAIParser(
        script_path="/missing/script.py",
        timeout_seconds=123,
        service_url="http://127.0.0.1:8001",
        service_timeout_seconds=45,
    )

    with pytest.raises(WorkerParseError, match="document-ai service returned invalid payload"):
        parser.parse(input_path=input_path, output_dir=tmp_path / "out")


def test_document_ai_parser_raises_when_service_http_fails_without_fallback(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    input_path = tmp_path / "sample.pdf"
    input_path.write_bytes(b"%PDF-1.4\n%%EOF\n")

    def fake_urlopen(*args, **kwargs) -> FakeHTTPResponse:
        raise HTTPError(
            url="http://127.0.0.1:8001/parse",
            code=503,
            msg="not ready",
            hdrs=None,
            fp=None,
        )

    monkeypatch.setattr("src.worker.parser.urlopen", fake_urlopen)
    parser = DocumentAIParser(
        script_path="/missing/script.py",
        timeout_seconds=123,
        service_url="http://127.0.0.1:8001",
        service_timeout_seconds=45,
    )

    with pytest.raises(WorkerParseError, match="document-ai service failed"):
        parser.parse(input_path=input_path, output_dir=tmp_path / "out")
