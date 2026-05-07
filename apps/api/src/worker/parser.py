from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from src.parser_backends import ParserBackend


class WorkerParseError(Exception):
    pass


@dataclass(frozen=True, slots=True)
class ParsedDocumentPayload:
    markdown: str
    canonical_json: dict


class WorkerParser(Protocol):
    def parse(self, *, input_path: Path, output_dir: Path) -> ParsedDocumentPayload: ...


class AIParsingServiceParser:
    def __init__(
        self,
        *,
        parser_backend: ParserBackend,
        service_url: str,
        timeout_seconds: int,
    ) -> None:
        self.parser_backend = parser_backend
        self.service_url = service_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def parse(self, *, input_path: Path, output_dir: Path) -> ParsedDocumentPayload:
        del output_dir
        boundary = f"----docmate-{uuid.uuid4().hex}"
        body = self._build_multipart_body(
            boundary=boundary,
            filename=input_path.name,
            file_bytes=input_path.read_bytes(),
            parser_backend=self.parser_backend,
            language="en",
        )
        request = Request(
            f"{self.service_url}/parse",
            data=body,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Content-Length": str(len(body)),
            },
            method="POST",
        )

        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                response_body = response.read()
        except HTTPError as exc:
            error_body = exc.read().decode(errors="ignore").strip() if exc.fp else ""
            msg = error_body or f"parsing service failed: {exc.code}"
            raise WorkerParseError(msg) from exc
        except (URLError, TimeoutError) as exc:
            msg = "parsing service request failed"
            raise WorkerParseError(msg) from exc

        try:
            payload = json.loads(response_body.decode())
        except json.JSONDecodeError as exc:
            msg = "parsing service returned invalid JSON"
            raise WorkerParseError(msg) from exc

        markdown = payload.get("markdown")
        canonical_json = payload.get("canonicalJson")
        if not isinstance(markdown, str) or not markdown.strip() or not isinstance(
            canonical_json, dict
        ):
            msg = "parsing service returned invalid payload"
            raise WorkerParseError(msg)

        return ParsedDocumentPayload(markdown=markdown.strip(), canonical_json=canonical_json)

    @staticmethod
    def _build_multipart_body(
        *,
        boundary: str,
        filename: str,
        file_bytes: bytes,
        parser_backend: ParserBackend,
        language: str,
    ) -> bytes:
        lines = [
            f"--{boundary}\r\n".encode(),
            b'Content-Disposition: form-data; name="parserBackend"\r\n\r\n',
            parser_backend.encode(),
            b"\r\n",
            f"--{boundary}\r\n".encode(),
            b'Content-Disposition: form-data; name="language"\r\n\r\n',
            language.encode(),
            b"\r\n",
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode(),
            b"Content-Type: application/octet-stream\r\n\r\n",
            file_bytes,
            b"\r\n",
            f"--{boundary}--\r\n".encode(),
        ]
        return b"".join(lines)
