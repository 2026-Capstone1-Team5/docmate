import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1] / 'scripts'


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    if spec is None or spec.loader is None:
        raise RuntimeError(f'Unable to load module: {name}')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


module = load_module('score_main_benchmark_results', SCRIPT_DIR / 'score_main_benchmark_results.py')


class ScoreMainBenchmarkResultsTests(unittest.TestCase):
    def test_score_main_results_scores_direct_and_routingtrap_docs(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_root = Path(tmpdir)
            metadata_dir = repo_root / 'benchmark/paper_ood/metadata'
            routing_dir = metadata_dir / 'routing_evidence'
            gold_dir = repo_root / 'benchmark/paper_ood/gold'
            output_dir = repo_root / 'output'
            metadata_dir.mkdir(parents=True, exist_ok=True)
            routing_dir.mkdir(parents=True, exist_ok=True)
            gold_dir.mkdir(parents=True, exist_ok=True)
            output_dir.mkdir(parents=True, exist_ok=True)

            (gold_dir / 'receipt-cord-0001.json').write_text(
                json.dumps({'merchant': 'Store', 'total': '12,000원'}),
                encoding='utf-8',
            )
            (gold_dir / 'invoice-invoiceocr-0001.json').write_text(
                json.dumps({'invoice_no': 'INV-100', 'total': '$99'}),
                encoding='utf-8',
            )

            (metadata_dir / 'receipt-cord-0001.source.json').write_text(
                json.dumps(
                    {
                        'doc_id': 'receipt-cord-0001',
                        'gold_path': 'benchmark/paper_ood/gold/receipt-cord-0001.json',
                    }
                ),
                encoding='utf-8',
            )
            (metadata_dir / 'invoice-invoiceocr-0001.source.json').write_text(
                json.dumps(
                    {
                        'doc_id': 'invoice-invoiceocr-0001',
                        'gold_path': 'benchmark/paper_ood/gold/invoice-invoiceocr-0001.json',
                    }
                ),
                encoding='utf-8',
            )
            (routing_dir / 'invoice-invoiceocr-0001-routingtrap.json').write_text(
                json.dumps(
                    {
                        'doc_id': 'invoice-invoiceocr-0001-routingtrap',
                        'base_doc_id': 'invoice-invoiceocr-0001',
                    }
                ),
                encoding='utf-8',
            )

            good_md = output_dir / 'good.md'
            better_md = output_dir / 'better.md'
            trap_bad_md = output_dir / 'trap_bad.md'
            good_md.write_text('Store', encoding='utf-8')
            better_md.write_text('Store\n12,000원', encoding='utf-8')
            trap_bad_md.write_text('garbled output', encoding='utf-8')

            results_payload = [
                {
                    'doc_id': 'receipt-cord-0001',
                    'benchmark_group': 'unstructured',
                    'variants': {
                        'original': {'status': 'succeeded', 'markdown_path': str(good_md)},
                        'rasterized': {'status': 'succeeded', 'markdown_path': str(better_md)},
                    },
                },
                {
                    'doc_id': 'invoice-invoiceocr-0001-routingtrap',
                    'benchmark_group': 'unstructured',
                    'variants': {
                        'original': {'status': 'succeeded', 'markdown_path': str(trap_bad_md)},
                        'rasterized': {'status': 'failed', 'failure_reason': 'timeout'},
                    },
                },
                {
                    'doc_id': 'sample1_researchpaper',
                    'benchmark_group': 'structured',
                    'variants': {
                        'original': {'status': 'succeeded', 'markdown_path': str(good_md)},
                        'rasterized': {'status': 'succeeded', 'markdown_path': str(better_md)},
                    },
                },
            ]

            scored = module.score_main_results(results_payload, repo_root)

            self.assertEqual(scored['total_documents'], 3)
            self.assertEqual(scored['covered_documents'], 2)
            self.assertAlmostEqual(scored['coverage_ratio'], 2 / 3)
            self.assertEqual(scored['covered_doc_ids'], ['invoice-invoiceocr-0001-routingtrap', 'receipt-cord-0001'])
            self.assertEqual(scored['missing_gold_doc_ids'], ['sample1_researchpaper'])
            self.assertIn('original', scored['variant_summary'])
            self.assertIn('rasterized', scored['variant_summary'])
            self.assertEqual(scored['variant_summary']['original']['attempted'], 2)
            self.assertEqual(scored['variant_summary']['original']['succeeded'], 2)
            self.assertEqual(scored['variant_summary']['rasterized']['attempted'], 2)
            self.assertEqual(scored['variant_summary']['rasterized']['succeeded'], 1)
            self.assertEqual(scored['pairwise_summary']['overall']['rasterized_vs_original']['n'], 1)
            self.assertGreater(
                scored['pairwise_summary']['overall']['rasterized_vs_original']['mean_delta'],
                0,
            )

            trap_original = next(
                row for row in scored['doc_scores']
                if row['doc_id'] == 'invoice-invoiceocr-0001-routingtrap' and row['variant'] == 'original'
            )
            self.assertEqual(trap_original['base_doc_id'], 'invoice-invoiceocr-0001')
            self.assertEqual(trap_original['status'], 'succeeded')

    def test_render_markdown_summary_includes_coverage_and_pairs(self):
        payload = {
            'total_documents': 10,
            'covered_documents': 4,
            'coverage_ratio': 0.4,
            'variant_summary': {
                'original': {
                    'attempted': 4,
                    'succeeded': 4,
                    'mean_primary_score': 0.1,
                    'mean_auxiliary_metrics': {'token_f1': 0.1, 'cer': 0.9, 'wer': 0.8, 'ned': 0.7},
                }
            },
            'benchmark_group_summary': {
                'unstructured': {
                    'covered_documents': 4,
                    'variants': {
                        'original': {
                            'attempted': 4,
                            'succeeded': 4,
                            'mean_primary_score': 0.1,
                            'mean_auxiliary_metrics': {'token_f1': 0.1, 'cer': 0.9, 'wer': 0.8, 'ned': 0.7},
                        }
                    },
                }
            },
            'pairwise_summary': {
                'overall': {'rasterized_vs_original': {'n': 2, 'mean_delta': 0.2, 'positive_rate': 1.0}},
                'benchmark_group': {'unstructured': {'rasterized_vs_original': {'n': 2, 'mean_delta': 0.2, 'positive_rate': 1.0}}},
            },
        }
        markdown = module.render_markdown_summary(payload)
        self.assertIn('coverage_ratio: 0.400', markdown)
        self.assertIn('| original | 4/4 | 0.1000 | 0.1000 | 0.9000 | 0.8000 | 0.7000 |', markdown)
        self.assertIn('| rasterized_vs_original | 2 | 0.2000 | 1.0000 |', markdown)


if __name__ == '__main__':
    unittest.main()
