#!/usr/bin/env python3

import argparse
import json
import statistics
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from benchmark_manifest_utils import resolve_repo_path
from score_paper_ood_results import compute_auxiliary_metrics, compute_metric, metric_to_primary_score

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_GOLD_FORMAT = 'fields_json'
DEFAULT_METRIC_FAMILY = 'token_f1'
PAIR_CANDIDATES = [
    ('rasterized', 'original'),
    ('auto', 'original'),
    ('auto', 'rasterized'),
]
AUXILIARY_METRICS = ('token_f1', 'cer', 'wer', 'ned')


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


def resolve_under_repo(repo_root: Path, raw_path: str | Path) -> Path:
    path = Path(str(raw_path))
    if not path.is_absolute():
        path = (repo_root / path).resolve()
    return path


def load_gold_index(repo_root: Path) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    metadata_dir = repo_root / 'benchmark/paper_ood/metadata'
    for path in metadata_dir.glob('*.source.json'):
        payload = load_json(path)
        doc_id = str(payload['doc_id'])
        index[doc_id] = {
            'gold_path': str(resolve_under_repo(repo_root, payload['gold_path'])),
            'gold_format': DEFAULT_GOLD_FORMAT,
            'metric_family': DEFAULT_METRIC_FAMILY,
            'base_doc_id': doc_id,
        }
    routing_dir = metadata_dir / 'routing_evidence'
    for path in routing_dir.glob('*.json'):
        payload = load_json(path)
        doc_id = str(payload['doc_id'])
        base_doc_id = str(payload['base_doc_id'])
        base = index.get(base_doc_id)
        if not base:
            continue
        index[doc_id] = {
            'gold_path': base['gold_path'],
            'gold_format': base['gold_format'],
            'metric_family': base['metric_family'],
            'base_doc_id': base_doc_id,
        }
    return index


def score_variant(doc_id: str, benchmark_group: str, variant: str, variant_payload: dict[str, Any], gold_info: dict[str, Any]) -> dict[str, Any]:
    status = variant_payload.get('status')
    if status != 'succeeded':
        return {
            'doc_id': doc_id,
            'benchmark_group': benchmark_group,
            'variant': variant,
            'status': 'failed',
            'failure_reason': variant_payload.get('failure_reason'),
            'metric_family': gold_info['metric_family'],
            'gold_format': gold_info['gold_format'],
            'base_doc_id': gold_info['base_doc_id'],
            'raw_metric': None,
            'primary_score': None,
            'auxiliary_metrics': {},
        }
    markdown_path = variant_payload.get('markdown_path')
    if not markdown_path or not Path(markdown_path).exists():
        return {
            'doc_id': doc_id,
            'benchmark_group': benchmark_group,
            'variant': variant,
            'status': 'failed',
            'failure_reason': 'missing_markdown',
            'metric_family': gold_info['metric_family'],
            'gold_format': gold_info['gold_format'],
            'base_doc_id': gold_info['base_doc_id'],
            'raw_metric': None,
            'primary_score': None,
            'auxiliary_metrics': {},
        }
    pred_text = Path(markdown_path).read_text(encoding='utf-8', errors='ignore')
    gold_path = Path(gold_info['gold_path'])
    raw_metric = compute_metric(
        gold_path=gold_path,
        gold_format=gold_info['gold_format'],
        metric_family=gold_info['metric_family'],
        pred_text=pred_text,
    )
    auxiliary = compute_auxiliary_metrics(
        gold_path=gold_path,
        gold_format=gold_info['gold_format'],
        pred_text=pred_text,
    )
    return {
        'doc_id': doc_id,
        'benchmark_group': benchmark_group,
        'variant': variant,
        'status': 'succeeded',
        'failure_reason': None,
        'metric_family': gold_info['metric_family'],
        'gold_format': gold_info['gold_format'],
        'base_doc_id': gold_info['base_doc_id'],
        'raw_metric': raw_metric,
        'primary_score': metric_to_primary_score(gold_info['metric_family'], raw_metric),
        'auxiliary_metrics': auxiliary,
    }


def summarize_variant(rows: list[dict[str, Any]]) -> dict[str, Any]:
    succeeded = [row for row in rows if row['status'] == 'succeeded' and row['primary_score'] is not None]
    metrics_summary = {}
    for metric in AUXILIARY_METRICS:
        metric_values = [row['auxiliary_metrics'][metric] for row in succeeded if metric in row.get('auxiliary_metrics', {})]
        metrics_summary[metric] = statistics.fmean(metric_values) if metric_values else None
    scores = [row['primary_score'] for row in succeeded]
    return {
        'attempted': len(rows),
        'succeeded': len(succeeded),
        'coverage_rate': (len(succeeded) / len(rows)) if rows else None,
        'mean_primary_score': statistics.fmean(scores) if scores else None,
        'median_primary_score': statistics.median(scores) if scores else None,
        'mean_auxiliary_metrics': metrics_summary,
    }


def summarize_pairwise(doc_rows: dict[str, dict[str, dict[str, Any]]], groups: set[str], variants_present: set[str]) -> dict[str, Any]:
    pairs = [(left, right) for left, right in PAIR_CANDIDATES if left in variants_present and right in variants_present]
    out: dict[str, Any] = {'overall': {}, 'benchmark_group': {}}
    for left, right in pairs:
        deltas = []
        for variants in doc_rows.values():
            l = variants.get(left)
            r = variants.get(right)
            if not l or not r:
                continue
            if l['status'] == 'succeeded' and r['status'] == 'succeeded' and l['primary_score'] is not None and r['primary_score'] is not None:
                deltas.append(l['primary_score'] - r['primary_score'])
        out['overall'][f'{left}_vs_{right}'] = {
            'n': len(deltas),
            'mean_delta': statistics.fmean(deltas) if deltas else None,
            'median_delta': statistics.median(deltas) if deltas else None,
            'positive_rate': (sum(1 for d in deltas if d > 0) / len(deltas)) if deltas else None,
        }
    for group in groups:
        group_pairs = {}
        for left, right in pairs:
            deltas = []
            for variants in doc_rows.values():
                l = variants.get(left)
                r = variants.get(right)
                if not l or not r or l.get('benchmark_group') != group or r.get('benchmark_group') != group:
                    continue
                if l['status'] == 'succeeded' and r['status'] == 'succeeded' and l['primary_score'] is not None and r['primary_score'] is not None:
                    deltas.append(l['primary_score'] - r['primary_score'])
            group_pairs[f'{left}_vs_{right}'] = {
                'n': len(deltas),
                'mean_delta': statistics.fmean(deltas) if deltas else None,
                'median_delta': statistics.median(deltas) if deltas else None,
                'positive_rate': (sum(1 for d in deltas if d > 0) / len(deltas)) if deltas else None,
            }
        out['benchmark_group'][group] = group_pairs
    return out


def score_main_results(results_payload: list[dict[str, Any]], repo_root: Path) -> dict[str, Any]:
    gold_index = load_gold_index(repo_root)
    scored_rows = []
    doc_rows: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    groups: set[str] = set()
    variants_present: set[str] = set()
    covered_doc_ids: list[str] = []
    missing_gold_doc_ids: list[str] = []
    for row in results_payload:
        doc_id = str(row['doc_id'])
        gold_info = gold_index.get(doc_id)
        if not gold_info:
            missing_gold_doc_ids.append(doc_id)
            continue
        covered_doc_ids.append(doc_id)
        benchmark_group = str(row['benchmark_group'])
        groups.add(benchmark_group)
        for variant, variant_payload in row.get('variants', {}).items():
            variants_present.add(variant)
            scored = score_variant(doc_id, benchmark_group, variant, variant_payload, gold_info)
            scored_rows.append(scored)
            doc_rows[doc_id][variant] = scored
    variant_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    benchmark_group_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    benchmark_group_summary: dict[str, dict[str, Any]] = defaultdict(dict)
    for row in scored_rows:
        variant_groups[row['variant']].append(row)
        benchmark_group_rows[row['benchmark_group']].append(row)
        benchmark_group_summary[row['benchmark_group']].setdefault(row['variant'], []).append(row)
    overall = {variant: summarize_variant(rows) for variant, rows in sorted(variant_groups.items())}
    by_group = {}
    for group, variants in sorted(benchmark_group_summary.items()):
        by_group[group] = {
            'covered_documents': len({row['doc_id'] for row in benchmark_group_rows[group]}),
            'variants': {variant: summarize_variant(rows) for variant, rows in sorted(variants.items())},
        }
    covered_doc_ids = sorted(set(covered_doc_ids))
    missing_gold_doc_ids = sorted(set(missing_gold_doc_ids))
    return {
        'total_documents': len(results_payload),
        'covered_documents': len(covered_doc_ids),
        'coverage_ratio': (len(covered_doc_ids) / len(results_payload)) if results_payload else None,
        'covered_doc_ids': covered_doc_ids,
        'missing_gold_doc_ids': missing_gold_doc_ids,
        'variant_summary': overall,
        'benchmark_group_summary': by_group,
        'pairwise_summary': summarize_pairwise(doc_rows, groups, variants_present),
        'doc_scores': scored_rows,
    }


def render_markdown_summary(payload: dict[str, Any]) -> str:
    lines = [
        '# Main benchmark quality summary',
        '',
        f"- total_documents: {payload['total_documents']}",
        f"- covered_documents: {payload['covered_documents']}",
        f"- coverage_ratio: {payload['coverage_ratio']:.3f}" if payload['coverage_ratio'] is not None else '- coverage_ratio: n/a',
        '',
        '## Variant summary',
        '',
        '| variant | covered | mean_primary_score | token_f1 | cer | wer | ned |',
        '|---|---:|---:|---:|---:|---:|---:|',
    ]
    for variant, summary in payload['variant_summary'].items():
        aux = summary['mean_auxiliary_metrics']
        lines.append(
            f"| {variant} | {summary['succeeded']}/{summary['attempted']} | "
            f"{('%.4f' % summary['mean_primary_score']) if summary['mean_primary_score'] is not None else 'n/a'} | "
            f"{('%.4f' % aux['token_f1']) if aux['token_f1'] is not None else 'n/a'} | "
            f"{('%.4f' % aux['cer']) if aux['cer'] is not None else 'n/a'} | "
            f"{('%.4f' % aux['wer']) if aux['wer'] is not None else 'n/a'} | "
            f"{('%.4f' % aux['ned']) if aux['ned'] is not None else 'n/a'} |"
        )
    lines.extend(['', '## Benchmark groups', ''])
    for group, info in payload['benchmark_group_summary'].items():
        lines.extend([
            f'### {group}',
            '',
            f"- covered_documents: {info['covered_documents']}",
            '',
            '| variant | covered | mean_primary_score | token_f1 | cer | wer | ned |',
            '|---|---:|---:|---:|---:|---:|---:|',
        ])
        for variant, summary in info['variants'].items():
            aux = summary['mean_auxiliary_metrics']
            lines.append(
                f"| {variant} | {summary['succeeded']}/{summary['attempted']} | "
                f"{('%.4f' % summary['mean_primary_score']) if summary['mean_primary_score'] is not None else 'n/a'} | "
                f"{('%.4f' % aux['token_f1']) if aux['token_f1'] is not None else 'n/a'} | "
                f"{('%.4f' % aux['cer']) if aux['cer'] is not None else 'n/a'} | "
                f"{('%.4f' % aux['wer']) if aux['wer'] is not None else 'n/a'} | "
                f"{('%.4f' % aux['ned']) if aux['ned'] is not None else 'n/a'} |"
            )
        lines.append('')
    if payload['pairwise_summary']['overall']:
        lines.extend(['## Pairwise deltas', '', '| pair | n | mean_delta | positive_rate |', '|---|---:|---:|---:|'])
        for pair, info in payload['pairwise_summary']['overall'].items():
            lines.append(
                f"| {pair} | {info['n']} | {('%.4f' % info['mean_delta']) if info['mean_delta'] is not None else 'n/a'} | {('%.4f' % info['positive_rate']) if info['positive_rate'] is not None else 'n/a'} |"
            )
        lines.append('')
    return '\n'.join(lines) + '\n'


def main() -> int:
    parser = argparse.ArgumentParser(description='Score main benchmark outputs with gold-linked quality metrics.')
    parser.add_argument('--results-json', required=True)
    parser.add_argument('--output-json', required=True)
    parser.add_argument('--output-md')
    args = parser.parse_args()
    results_path = resolve_repo_path(args.results_json)
    output_path = resolve_repo_path(args.output_json)
    payload = load_json(results_path)
    scored = score_main_results(payload, REPO_ROOT)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(scored, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    output_md = resolve_repo_path(args.output_md) if args.output_md else output_path.with_suffix('.md')
    output_md.write_text(render_markdown_summary(scored), encoding='utf-8')
    print(json.dumps({
        'covered_documents': scored['covered_documents'],
        'coverage_ratio': scored['coverage_ratio'],
        'variant_summary': scored['variant_summary'],
    }, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
