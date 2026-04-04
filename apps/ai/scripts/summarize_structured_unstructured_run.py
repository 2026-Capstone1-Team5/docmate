#!/usr/bin/env python3

import argparse
import json
from pathlib import Path
import sys
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from benchmark_manifest_utils import resolve_repo_path
from benchmark_structured_unstructured import load_manifest, summarize, resolve_markdown_output, VARIANT_SPECS


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Summarize an existing structured/unstructured benchmark run from run-root outputs.'
    )
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--run-root', required=True)
    parser.add_argument('--variants', default='original,rasterized,auto')
    parser.add_argument('--output-json')
    parser.add_argument('--output-summary')
    return parser.parse_args()


def load_variant_result(doc_id: str, variant: str, run_root: Path) -> dict[str, Any]:
    output_dir = run_root / doc_id / variant
    meta_path = output_dir / 'meta.json'
    if meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding='utf-8'))
        markdown_path, markdown_key = resolve_markdown_output(meta)
        markdown_chars = None
        if markdown_path and Path(markdown_path).exists():
            markdown_chars = len(Path(markdown_path).read_text(encoding='utf-8', errors='ignore'))
        return {
            'variant': variant,
            'status': 'succeeded',
            'failure_reason': None,
            'elapsed_seconds': 0.0,
            'requested_mode': VARIANT_SPECS[variant]['requested_mode'],
            'parse_mode': meta.get('parse_mode'),
            'inspection': meta.get('inspection'),
            'markdown_path': markdown_path,
            'markdown_output_key': markdown_key,
            'markdown_chars': markdown_chars,
        }
    error_path = output_dir / 'parse_error.txt'
    failure_reason = 'missing_meta_json'
    if error_path.exists():
        failure_reason = error_path.read_text(encoding='utf-8', errors='ignore').strip() or 'parse_error'
    return {
        'variant': variant,
        'status': 'failed',
        'failure_reason': failure_reason,
        'elapsed_seconds': None,
        'requested_mode': VARIANT_SPECS[variant]['requested_mode'],
    }


def main() -> int:
    args = parse_args()
    variants = [v.strip() for v in args.variants.split(',') if v.strip()]
    unsupported = [v for v in variants if v not in VARIANT_SPECS]
    if unsupported:
        raise SystemExit(f'Unsupported variants: {unsupported}')
    manifest_path = resolve_repo_path(args.manifest)
    run_root = resolve_repo_path(args.run_root)
    rows = load_manifest(manifest_path)
    results: list[dict[str, Any]] = []
    for row in rows:
        rendered = dict(row)
        rendered['variants'] = {variant: load_variant_result(row['doc_id'], variant, run_root) for variant in variants}
        results.append(rendered)
    summary = summarize(results, variants)
    if args.output_json:
        output_json = resolve_repo_path(args.output_json)
        output_json.parent.mkdir(parents=True, exist_ok=True)
        output_json.write_text(json.dumps(results, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    if args.output_summary:
        output_summary = resolve_repo_path(args.output_summary)
        output_summary.parent.mkdir(parents=True, exist_ok=True)
        output_summary.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
