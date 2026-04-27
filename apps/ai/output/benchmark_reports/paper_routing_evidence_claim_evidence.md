# Paper Claim Evidence

- claim_mode: `controlled_classifier_unreliability_supported`
- recommended_wording: The controlled dataset supports a narrow claim: under harmful-text-layer conditions, classify() can choose the text path while MinerU's own thresholds look acceptable and rasterization mitigates the aggregate failure.

## Main OOD quantitative rows

| variant | n | mean_primary_score | mean_token_f1 | mean_cer | mean_wer | mean_ned |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| original | 13 | 0.127 | 0.127 | 3.421 | 1.627 | 0.838 |
| rasterized | 13 | 0.209 | 0.209 | 0.889 | 0.936 | 0.786 |
| auto | 13 | 0.201 | 0.201 | 0.896 | 0.942 | 0.792 |

## Direct classify() observations on OOD docs

| doc_id | subgroup | classify_accepts_text | supports_claim | avg_chars | invalid_ratio | image_ratio | original_score | rasterized_score | auto_score | original_cer | rasterized_cer | auto_cer |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| receipt-sroie-0001-routingtrap | receipt | True | True | 1548.000 | 0.000 | 0.000 | 0.176 | 0.429 | 0.429 | 15.102 | 1.500 | 1.500 |
| receipt-sroie-0002-routingtrap | receipt | True | False | 1615.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.796 | 0.893 | 0.893 |
| receipt-sroie-0003-routingtrap | receipt | True | False | 1609.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.887 | 0.868 | 0.868 |
| receipt-sroie-0004-routingtrap | receipt | True | True | 1560.000 | 0.000 | 0.000 | 0.117 | 0.333 | 0.333 | 19.815 | 1.086 | 1.086 |
| receipt-sroie-0005-routingtrap | receipt | True | False | 1588.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.902 | 0.908 | 0.908 |
| receipt-sroie-0006-routingtrap | receipt | True | False | 1613.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.892 | 0.922 | 0.922 |
| receipt-cord-0001-routingtrap | receipt | True | False | 1654.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.841 | 0.899 | 0.899 |
| receipt-cord-0002-routingtrap | receipt | True | True | 1568.000 | 0.000 | 0.000 | 0.381 | 0.596 | 0.596 | 0.908 | 0.466 | 0.466 |
| receipt-cord-0003-routingtrap | receipt | True | False | 1296.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.891 | 0.878 | 0.878 |
| receipt-cord-0004-routingtrap | receipt | True | False | 1764.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.933 | 0.921 | 0.921 |
| invoice-invoiceocr-0001-routingtrap | invoice | True | True | 2230.000 | 0.000 | 0.000 | 0.200 | 0.439 | 0.439 | 0.995 | 0.817 | 0.817 |
| invoice-invoiceocr-0002-routingtrap | invoice | True | True | 2730.000 | 0.000 | 0.000 | 0.311 | 0.415 | 0.311 | 0.820 | 0.721 | 0.820 |
| invoice-invoiceocr-0003-routingtrap | invoice | True | True | 1548.000 | 0.000 | 0.000 | 0.462 | 0.504 | 0.504 | 0.698 | 0.673 | 0.673 |

## Pairwise summary

```json
{
  "auto_vs_original": {
    "n": 13,
    "mean_delta": 0.07426106853444817,
    "median_delta": 0.0,
    "bootstrap_mean_ci95": [
      0.019774664019488537,
      0.1402819735966752
    ],
    "bootstrap_median_ci95": [
      0.0,
      0.21479229989868281
    ],
    "positive_rate": 0.38461538461538464,
    "sign_test_p_value": 0.0625
  },
  "rasterized_vs_original": {
    "n": 13,
    "mean_delta": 0.08230661134349575,
    "median_delta": 0.0,
    "bootstrap_mean_ci95": [
      0.027437915142596397,
      0.14435497776830172
    ],
    "bootstrap_median_ci95": [
      0.0,
      0.21479229989868281
    ],
    "positive_rate": 0.46153846153846156,
    "sign_test_p_value": 0.03125
  },
  "auto_vs_rasterized": {
    "n": 13,
    "mean_delta": -0.008045542809047594,
    "median_delta": 0.0,
    "bootstrap_mean_ci95": [
      -0.02413662842714278,
      0.0
    ],
    "bootstrap_median_ci95": [
      0.0,
      0.0
    ],
    "positive_rate": 0.0,
    "sign_test_p_value": 1.0
  }
}
```
