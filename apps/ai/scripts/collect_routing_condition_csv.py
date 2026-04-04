#!/usr/bin/env python3

import argparse
import csv
import importlib.util
from pathlib import Path
from typing import Any

from pdfminer.high_level import extract_text
from pdfminer.layout import LAParams


REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT_DIR = Path(__file__).resolve().parent
CID_PATTERN = "(cid:"
DEFAULT_MANIFEST_CSV = REPO_ROOT / "benchmark/manifest.csv"
DEFAULT_RUN_ROOT = REPO_ROOT / "output/routing_condition_benchmark"
DEFAULT_OUTPUT_CSV = REPO_ROOT / "output/benchmark_reports/routing_condition_metrics.csv"
CONDITIONS = ("original", "rasterized", "text_layer_removed")
CSV_COLUMNS = (
    "filename",
    "condition",
    "avg_chars",
    "abnormal_ratio",
    "img_coverage",
    "cid_font",
    "classify_result",
    "mineru_output_path",
)


def load_sibling_module(name: str):
    module_path = SCRIPT_DIR / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load sibling module: {name}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


benchmark_utils = load_sibling_module("benchmark_manifest_utils")
load_benchmark_manifest_csv = benchmark_utils.load_benchmark_manifest_csv
resolve_repo_path = benchmark_utils.resolve_repo_path
parse_document = load_sibling_module("parse_document")
observe_module = load_sibling_module("observe_paper_ood_routing")
observe_pdf = observe_module.observe_pdf
text_layer_strip_pdf = load_sibling_module("text_layer_strip_pdf")


def stringify_repo_path(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return str(path.resolve())


def detect_cid_font_signal(pdf_path: Path) -> bool:
    text = extract_text(
        pdf_file=str(pdf_path),
        laparams=LAParams(
            line_overlap=0.5,
            char_margin=2.0,
            line_margin=0.5,
            word_margin=0.1,
            boxes_flow=None,
            detect_vertical=False,
            all_texts=False,
        ),
    )
    return CID_PATTERN in text


def build_condition_input(
    row: dict[str, Any],
    condition: str,
    output_dir: Path,
) -> tuple[Path, dict[str, Any] | None]:
    source_pdf = Path(str(row["input_pdf"])).resolve()
    if condition == "text_layer_removed":
        intermediate_dir = output_dir / "intermediate"
        intermediate_dir.mkdir(parents=True, exist_ok=True)
        stripped_pdf = intermediate_dir / f"{source_pdf.stem}_text_layer_removed.pdf"
        provenance = text_layer_strip_pdf.build_provenance_payload(
            source_pdf,
            stripped_pdf,
            dpi=300,
            max_text_chars=0,
            page_size_tolerance=0.01,
            render_diff_dpi=72,
            render_diff_tolerance=0.01,
        )
        return stripped_pdf, provenance
    return source_pdf, None


def parse_condition_row(row: dict[str, Any], condition: str, run_root: Path) -> dict[str, Any]:
    output_dir = run_root / Path(str(row["doc_id"])) / condition
    output_dir.mkdir(parents=True, exist_ok=True)

    input_pdf, provenance = build_condition_input(row, condition, output_dir)
    observed_pdf = input_pdf
    if condition == "rasterized":
        observed_pdf = output_dir / "intermediate" / f"{Path(str(row['input_pdf'])).stem}_rasterized.pdf"

    parse_error: str | None = None
    try:
        if condition == "rasterized":
            parse_document.parse_one_variant(
                Path(str(row["input_pdf"])).resolve(),
                output_dir,
                str(row.get("language") or "en"),
                300,
                "rasterized",
            )
        else:
            parse_document.parse_one_variant(
                input_pdf,
                output_dir,
                str(row.get("language") or "en"),
                300,
                "normal",
            )
    except Exception as exc:  # pragma: no cover - depends on runtime/model support
        parse_error = str(exc)

    observation = observe_pdf(observed_pdf)
    result = {
        "filename": row["filename"],
        "condition": condition,
        "avg_chars": observation.get("avg_cleaned_chars_per_page"),
        "abnormal_ratio": observation.get("invalid_char_ratio"),
        "img_coverage": observation.get("high_image_coverage_ratio"),
        "cid_font": detect_cid_font_signal(observed_pdf),
        "classify_result": observation.get("classify_result"),
        "mineru_output_path": stringify_repo_path(output_dir / "mineru_output") if parse_error is None else "",
    }
    if provenance is not None:
        provenance_path = output_dir / "intermediate" / f"{observed_pdf.name}.provenance.json"
        provenance_path.write_text(__import__("json").dumps(provenance, indent=2) + "\n", encoding="utf-8")
    if parse_error is not None:
        (output_dir / "parse_error.txt").write_text(parse_error + "\n", encoding="utf-8")
    return result


def filter_rows(
    rows: list[dict[str, Any]],
    *,
    doc_id_contains: list[str],
    limit: int | None,
) -> list[dict[str, Any]]:
    filtered = rows
    if doc_id_contains:
        needles = [item.lower() for item in doc_id_contains]
        filtered = [
            row
            for row in rows
            if any(needle in str(row["doc_id"]).lower() for needle in needles)
        ]
    if limit is not None:
        filtered = filtered[:limit]
    return filtered


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key) for key in CSV_COLUMNS})


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Collect routing/classification metrics and MinerU output paths for original, rasterized, and text-layer-removed conditions."
    )
    parser.add_argument("--manifest-csv", default=str(DEFAULT_MANIFEST_CSV))
    parser.add_argument("--run-root", default=str(DEFAULT_RUN_ROOT))
    parser.add_argument("--output-csv", default=str(DEFAULT_OUTPUT_CSV))
    parser.add_argument("--conditions", default="original,rasterized,text_layer_removed")
    parser.add_argument("--doc-id-contains", action="append", default=[])
    parser.add_argument("--limit", type=int, default=None)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest_csv = resolve_repo_path(args.manifest_csv)
    run_root = resolve_repo_path(args.run_root)
    output_csv = resolve_repo_path(args.output_csv)
    conditions = [item.strip() for item in args.conditions.split(",") if item.strip()]
    unsupported = [item for item in conditions if item not in CONDITIONS]
    if unsupported:
        raise SystemExit(f"Unsupported conditions: {unsupported}")

    rows = filter_rows(
        load_benchmark_manifest_csv(manifest_csv),
        doc_id_contains=args.doc_id_contains,
        limit=args.limit,
    )
    rendered_rows: list[dict[str, Any]] = []
    for row in rows:
        for condition in conditions:
            rendered_rows.append(parse_condition_row(row, condition, run_root))

    write_csv(output_csv, rendered_rows)
    print(f"Saved CSV: {output_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
