from pathlib import Path

import pytest

from src.worker import main as worker_main
from src.worker.parser import AIParsingServiceParser


def test_build_parsers_requires_parsing_service_url(monkeypatch) -> None:
    class SettingsStub:
        enabled_parser_backends = ["markitdown", "pdftotext", "document_ai"]
        parser_timeout_seconds = 30
        document_ai_script_path = None
        document_ai_service_url = None
        document_ai_service_timeout_seconds = 30
        parsing_service_url = None
        parsing_service_timeout_seconds = 45

    monkeypatch.setattr(worker_main, "get_settings", lambda: SettingsStub())

    with pytest.raises(RuntimeError, match="parsing_service_url is required"):
        worker_main._build_parsers()


def test_build_parsers_routes_all_enabled_backends_to_ai_service(monkeypatch) -> None:
    class SettingsStub:
        enabled_parser_backends = ["markitdown", "pdftotext", "document_ai"]
        parser_timeout_seconds = 30
        document_ai_script_path = None
        document_ai_service_url = None
        document_ai_service_timeout_seconds = 30
        parsing_service_url = "http://document-ai:8001"
        parsing_service_timeout_seconds = 45

    monkeypatch.setattr(worker_main, "get_settings", lambda: SettingsStub())

    parsers = worker_main._build_parsers()

    assert set(parsers) == {"markitdown", "pdftotext", "document_ai"}
    for backend, parser in parsers.items():
        assert isinstance(parser, AIParsingServiceParser)
        assert parser.parser_backend == backend
        assert parser.service_url == "http://document-ai:8001"
        assert parser.timeout_seconds == 45


def test_build_parsers_ignores_legacy_document_ai_script_path(monkeypatch, tmp_path) -> None:
    script_path = tmp_path / "parse_document.py"
    script_path.write_text("print('ok')")

    class SettingsStub:
        enabled_parser_backends = ["document_ai"]
        parser_timeout_seconds = 30
        document_ai_script_path = str(script_path)
        document_ai_service_url = None
        document_ai_service_timeout_seconds = 30
        parsing_service_url = "http://document-ai:8001"
        parsing_service_timeout_seconds = 45

    monkeypatch.setattr(worker_main, "get_settings", lambda: SettingsStub())

    parsers = worker_main._build_parsers()
    parser = parsers["document_ai"]

    assert "document_ai" in parsers
    assert isinstance(parser, AIParsingServiceParser)
    assert parser.service_url == "http://document-ai:8001"
    assert Path(script_path).is_file()
