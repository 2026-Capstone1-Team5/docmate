from typing import Literal
from typing import get_args

ParserBackend = Literal["markitdown", "pdftotext", "document_ai"]

DEFAULT_REQUEST_PARSER_BACKEND: ParserBackend = "markitdown"
DEFAULT_SERVICE_PARSER_BACKEND: ParserBackend = "document_ai"
PARSER_BACKEND_VALUES = get_args(ParserBackend)
PARSER_BACKEND_VALUES_SET = set(PARSER_BACKEND_VALUES)
DEFAULT_ENABLED_PARSER_BACKENDS: tuple[ParserBackend, ...] = (
    "markitdown",
    "pdftotext",
)
PDF_ONLY_PARSER_BACKENDS: frozenset[ParserBackend] = frozenset(("pdftotext", "document_ai"))


def normalize_parser_backend(value: str) -> ParserBackend:
    normalized = value.strip().lower()
    if normalized not in PARSER_BACKEND_VALUES_SET:
        msg = f"parser backend must be one of: {', '.join(PARSER_BACKEND_VALUES)}"
        raise ValueError(msg)
    return normalized  # type: ignore[return-value]


def parser_backend_requires_pdf(parser_backend: ParserBackend) -> bool:
    return parser_backend in PDF_ONLY_PARSER_BACKENDS
