from __future__ import annotations

import json
from pathlib import Path
from urllib.error import HTTPError, URLError

import pytest

from src.worker.parser import AIParsingServiceParser, WorkerParseError


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


def test_ai_parsing_service_parser_posts_backend_to_service(
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
    parser = AIParsingServiceParser(
        parser_backend="document_ai",
        service_url="http://127.0.0.1:8001/",
        timeout_seconds=45,
    )

    parsed = parser.parse(input_path=input_path, output_dir=tmp_path / "out")

    assert parsed.markdown == "# Parsed"
    assert parsed.canonical_json["document"]["source"] == "document_ai_service"
    assert calls[0][0] == "http://127.0.0.1:8001/parse"
    assert b'name="parserBackend"' in calls[0][1]
    assert b"document_ai" in calls[0][1]
    assert b'name="language"' in calls[0][1]
    assert b"en" in calls[0][1]
    assert calls[0][3] == 45


def test_ai_parsing_service_parser_raises_when_payload_is_invalid(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    input_path = tmp_path / "sample.pdf"
    input_path.write_bytes(b"%PDF-1.4\n%%EOF\n")

    def fake_urlopen(*args, **kwargs) -> FakeHTTPResponse:
        return FakeHTTPResponse(payload={"markdown": ""})

    monkeypatch.setattr("src.worker.parser.urlopen", fake_urlopen)
    parser = AIParsingServiceParser(
        parser_backend="markitdown",
        service_url="http://127.0.0.1:8001",
        timeout_seconds=45,
    )

    with pytest.raises(WorkerParseError, match="parsing service returned invalid payload"):
        parser.parse(input_path=input_path, output_dir=tmp_path / "out")


def test_ai_parsing_service_parser_raises_when_http_fails(
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
    parser = AIParsingServiceParser(
        parser_backend="pdftotext",
        service_url="http://127.0.0.1:8001",
        timeout_seconds=45,
    )

    with pytest.raises(WorkerParseError, match="parsing service failed"):
        parser.parse(input_path=input_path, output_dir=tmp_path / "out")


def test_ai_parsing_service_parser_raises_when_request_fails(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    input_path = tmp_path / "sample.pdf"
    input_path.write_bytes(b"%PDF-1.4\n%%EOF\n")

    def fake_urlopen(*args, **kwargs) -> FakeHTTPResponse:
        raise URLError("not ready")

    monkeypatch.setattr("src.worker.parser.urlopen", fake_urlopen)
    parser = AIParsingServiceParser(
        parser_backend="markitdown",
        service_url="http://127.0.0.1:8001",
        timeout_seconds=45,
    )

    with pytest.raises(WorkerParseError, match="parsing service request failed"):
        parser.parse(input_path=input_path, output_dir=tmp_path / "out")
