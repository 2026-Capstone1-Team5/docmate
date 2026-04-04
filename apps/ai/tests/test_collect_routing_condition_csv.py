import csv
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT_DIR = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

_spec = importlib.util.spec_from_file_location(
    "collect_routing_condition_csv", str(SCRIPT_DIR / "collect_routing_condition_csv.py")
)
if _spec is None or _spec.loader is None:
    raise RuntimeError("Unable to load collect_routing_condition_csv module for tests")
collect = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(collect)


class FilterRowsTests(unittest.TestCase):
    def test_filter_rows_by_doc_id_contains_and_limit(self):
        rows = [
            {"doc_id": "receipt-1"},
            {"doc_id": "invoice-1"},
            {"doc_id": "paper-1"},
        ]

        filtered = collect.filter_rows(rows, doc_id_contains=["receipt", "invoice"], limit=1)

        self.assertEqual(filtered, [{"doc_id": "receipt-1"}])


class ParseConditionRowTests(unittest.TestCase):
    def test_parse_condition_row_for_original_uses_source_pdf(self):
        row = {
            "doc_id": "receipt-1",
            "filename": "benchmark/pdfs/receipt-1.pdf",
            "input_pdf": "/repo/benchmark/pdfs/receipt-1.pdf",
            "language": "en",
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            with (
                mock.patch.object(
                    collect.parse_document,
                    "parse_one_variant",
                    return_value={"parse_input": "/repo/benchmark/pdfs/receipt-1.pdf"},
                ) as parse_one_variant,
                mock.patch.object(
                    collect,
                    "observe_pdf",
                    return_value={
                        "avg_cleaned_chars_per_page": 88.0,
                        "invalid_char_ratio": 0.02,
                        "high_image_coverage_ratio": 0.1,
                        "classify_result": "txt",
                    },
                ),
                mock.patch.object(collect, "detect_cid_font_signal", return_value=False),
                mock.patch.object(collect, "stringify_repo_path", side_effect=lambda path: str(path)),
            ):
                rendered = collect.parse_condition_row(row, "original", Path(tmpdir))

        parse_one_variant.assert_called_once()
        self.assertEqual(rendered["condition"], "original")
        self.assertEqual(rendered["classify_result"], "txt")
        self.assertEqual(rendered["abnormal_ratio"], 0.02)

    def test_parse_condition_row_for_text_layer_removed_builds_intermediate_pdf(self):
        row = {
            "doc_id": "receipt-1",
            "filename": "benchmark/pdfs/receipt-1.pdf",
            "input_pdf": "/repo/benchmark/pdfs/receipt-1.pdf",
            "language": "en",
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            run_root = Path(tmpdir)
            expected_intermediate = run_root / "receipt-1" / "text_layer_removed" / "intermediate" / "receipt-1_text_layer_removed.pdf"
            with (
                mock.patch.object(
                    collect.text_layer_strip_pdf,
                    "build_provenance_payload",
                    return_value={"validation": {"text_layer_removed": True}},
                ) as build_provenance_payload,
                mock.patch.object(
                    collect.parse_document,
                    "parse_one_variant",
                    return_value={"parse_input": str(expected_intermediate)},
                ),
                mock.patch.object(
                    collect,
                    "observe_pdf",
                    return_value={
                        "avg_cleaned_chars_per_page": 0.0,
                        "invalid_char_ratio": 0.0,
                        "high_image_coverage_ratio": 1.0,
                        "classify_result": "ocr",
                    },
                ),
                mock.patch.object(collect, "detect_cid_font_signal", return_value=False),
                mock.patch.object(collect, "stringify_repo_path", side_effect=lambda path: str(path)),
            ):
                rendered = collect.parse_condition_row(row, "text_layer_removed", run_root)

        build_provenance_payload.assert_called_once()
        self.assertEqual(rendered["condition"], "text_layer_removed")
        self.assertEqual(rendered["classify_result"], "ocr")


class WriteCsvTests(unittest.TestCase):
    def test_write_csv_uses_expected_columns(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            output_csv = Path(tmpdir) / "routing.csv"
            collect.write_csv(
                output_csv,
                [
                    {
                        "filename": "benchmark/pdfs/a.pdf",
                        "condition": "original",
                        "avg_chars": 10,
                        "abnormal_ratio": 0.01,
                        "img_coverage": 0.5,
                        "cid_font": False,
                        "classify_result": "txt",
                        "mineru_output_path": "output/a/original/mineru_output",
                    }
                ],
            )

            with output_csv.open("r", encoding="utf-8", newline="") as handle:
                reader = csv.DictReader(handle)
                rows = list(reader)

        self.assertEqual(reader.fieldnames, list(collect.CSV_COLUMNS))
        self.assertEqual(rows[0]["condition"], "original")


class MainTests(unittest.TestCase):
    def test_main_renders_each_row_for_each_condition(self):
        fake_rows = [
            {
                "doc_id": "receipt-1",
                "filename": "benchmark/pdfs/receipt-1.pdf",
                "input_pdf": "/repo/benchmark/pdfs/receipt-1.pdf",
                "language": "en",
            }
        ]
        rendered_rows: list[tuple[str, str]] = []

        def fake_parse_condition_row(row, condition, run_root):
            rendered_rows.append((row["doc_id"], condition))
            return {
                "filename": row["filename"],
                "condition": condition,
                "avg_chars": 1,
                "abnormal_ratio": 0.0,
                "img_coverage": 0.0,
                "cid_font": False,
                "classify_result": "txt",
                "mineru_output_path": "x",
            }

        with tempfile.TemporaryDirectory() as tmpdir:
            output_csv = Path(tmpdir) / "routing.csv"
            with (
                mock.patch.object(collect, "load_benchmark_manifest_csv", return_value=fake_rows),
                mock.patch.object(collect, "parse_condition_row", side_effect=fake_parse_condition_row),
                mock.patch.object(collect, "resolve_repo_path", side_effect=lambda value: Path(value)),
                mock.patch.object(
                    sys,
                    "argv",
                    [
                        "collect_routing_condition_csv.py",
                        "--manifest-csv",
                        "benchmark/manifest.csv",
                        "--run-root",
                        tmpdir,
                        "--output-csv",
                        str(output_csv),
                    ],
                ),
            ):
                collect.main()

            with output_csv.open("r", encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))

        self.assertEqual(
            rendered_rows,
            [
                ("receipt-1", "original"),
                ("receipt-1", "rasterized"),
                ("receipt-1", "text_layer_removed"),
            ],
        )
        self.assertEqual(len(rows), 3)


if __name__ == "__main__":
    unittest.main()
