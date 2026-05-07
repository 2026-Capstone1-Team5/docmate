from __future__ import annotations

import sys
import tempfile
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from parse_document import build_output_map  # noqa: E402
from parse_document import find_output_stem  # noqa: E402
from parse_document import find_txt_dir  # noqa: E402
from parse_document import inspect_pdf  # noqa: E402
from parse_document import rasterize_pdf  # noqa: E402
from parse_document import run_mineru  # noqa: E402


class DocumentAIRuntime:
    def __init__(self) -> None:
        self._ready = False

    @property
    def ready(self) -> bool:
        return self._ready

    def ensure_ready(self) -> None:
        if self._ready:
            return

        from mineru.backend.pipeline import pipeline_analyze  # noqa: F401
        from mineru.cli.common import do_parse  # noqa: F401

        self._ready = True

    def parse_pdf(
        self,
        *,
        pdf_path: Path,
        output_dir: Path,
        language: str,
        dpi: int = 300,
    ) -> dict[str, Any]:
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
        markdown = Path(markdown_path).read_text(errors="ignore").strip() if markdown_path else ""

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
