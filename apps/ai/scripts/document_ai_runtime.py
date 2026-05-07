from __future__ import annotations

import sys
import subprocess
import tempfile
import threading
from pathlib import Path
from typing import Any
from typing import Literal

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from parse_document import build_output_map  # noqa: E402
from parse_document import find_output_stem  # noqa: E402
from parse_document import find_txt_dir  # noqa: E402
from parse_document import inspect_pdf  # noqa: E402
from parse_document import rasterize_pdf  # noqa: E402
from parse_document import run_mineru  # noqa: E402

ParserBackend = Literal["markitdown", "pdftotext", "document_ai"]


class DocumentAIRuntime:
    def __init__(self, *, pdftotext_command: str = "pdftotext", parser_timeout_seconds: int = 300) -> None:
        self._ready = False
        self._parse_lock = threading.Lock()
        self.pdftotext_command = pdftotext_command
        self.parser_timeout_seconds = parser_timeout_seconds

    @property
    def ready(self) -> bool:
        return self._ready

    def ensure_ready(self) -> None:
        if self._ready:
            return

        from mineru.backend.pipeline import pipeline_analyze  # noqa: F401
        from mineru.cli.common import do_parse  # noqa: F401

        self._ready = True

    def parse_document(
        self,
        *,
        input_path: Path,
        output_dir: Path,
        parser_backend: ParserBackend,
        language: str,
    ) -> dict[str, Any]:
        if parser_backend == "markitdown":
            return self.parse_markitdown(input_path=input_path)
        if parser_backend == "pdftotext":
            return self.parse_pdftotext(input_path=input_path)
        if parser_backend == "document_ai":
            return self.parse_pdf(pdf_path=input_path, output_dir=output_dir, language=language)

        msg = f"unsupported parser backend: {parser_backend}"
        raise ValueError(msg)

    def parse_markitdown(self, *, input_path: Path) -> dict[str, Any]:
        try:
            from markitdown import MarkItDown
        except ImportError as exc:
            msg = "markitdown is not installed"
            raise RuntimeError(msg) from exc

        converter = MarkItDown(enable_plugins=False)
        try:
            result = converter.convert(str(input_path))
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(str(exc)) from exc

        markdown = result.text_content.strip()
        if not markdown:
            msg = "markitdown returned no extractable text"
            raise RuntimeError(msg)

        return {
            "markdown": markdown,
            "canonical_json": {
                "document": {
                    "source": "markitdown",
                    "filename": input_path.name,
                },
                "blocks": [{"type": "text", "text": markdown}],
            },
            "metadata": {"parser_backend": "markitdown"},
        }

    def parse_pdftotext(self, *, input_path: Path) -> dict[str, Any]:
        completed = subprocess.run(
            [self.pdftotext_command, "-layout", str(input_path), "-"],
            check=False,
            capture_output=True,
            text=True,
            timeout=self.parser_timeout_seconds,
        )
        if completed.returncode != 0:
            stderr = completed.stderr.strip() or completed.stdout.strip() or "pdftotext failed"
            raise RuntimeError(stderr)

        markdown = completed.stdout.strip()
        if not markdown:
            msg = "pdftotext returned no extractable text"
            raise RuntimeError(msg)

        return {
            "markdown": markdown,
            "canonical_json": {
                "document": {
                    "source": "pdftotext",
                    "filename": input_path.name,
                },
                "blocks": [{"type": "text", "text": markdown}],
            },
            "metadata": {"parser_backend": "pdftotext"},
        }

    def parse_pdf(
        self,
        *,
        pdf_path: Path,
        output_dir: Path,
        language: str,
        dpi: int = 300,
    ) -> dict[str, Any]:
        with self._parse_lock:
            self.ensure_ready()

            pdf_path = pdf_path.resolve()
            output_dir = output_dir.resolve()
            output_dir.mkdir(parents=True, exist_ok=True)

            inspection = inspect_pdf(pdf_path)
            parse_mode = "rasterized" if inspection["suspicious"] else "normal"
            parse_input = pdf_path
            rasterized_pdf: Path | None = None

            if parse_mode == "rasterized":
                rasterized_dir = output_dir / "intermediate"
                rasterized_dir.mkdir(parents=True, exist_ok=True)
                rasterized_pdf = rasterized_dir / f"{pdf_path.stem}_rasterized.pdf"
                rasterize_pdf(pdf_path, rasterized_pdf, dpi=dpi)
                parse_input = rasterized_pdf

            result_root = output_dir / "mineru_output"
            result_root.mkdir(parents=True, exist_ok=True)
            run_mineru(parse_input, result_root, language)

            output_stem = find_output_stem(result_root, parse_input.stem)
            txt_dir = find_txt_dir(result_root, output_stem)
            outputs = build_output_map(txt_dir, output_stem)
            markdown_path = outputs.get("markdown")
            markdown = (
                Path(markdown_path).read_text(errors="ignore").strip() if markdown_path else ""
            )

            metadata: dict[str, Any] = {
                "input_pdf": str(pdf_path),
                "parse_input": str(parse_input),
                "parse_mode": parse_mode,
                "language": language,
                "inspection": inspection,
                "outputs": outputs,
            }
            if rasterized_pdf is not None:
                metadata["rasterized_pdf"] = str(rasterized_pdf)

            return {
                "markdown": markdown,
                "canonical_json": {
                    "document": {
                        "source": "document_ai_service",
                        "filename": pdf_path.name,
                        "language": language,
                        "parse_mode": parse_mode,
                        "inspection": inspection,
                    },
                    "blocks": [{"type": "text", "text": markdown}],
                },
                "metadata": metadata,
            }


runtime = DocumentAIRuntime()


def create_work_dir() -> tempfile.TemporaryDirectory[str]:
    return tempfile.TemporaryDirectory(prefix="document-ai-service-")
