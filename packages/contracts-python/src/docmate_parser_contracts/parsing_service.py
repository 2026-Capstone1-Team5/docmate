from typing import Any

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field

from docmate_parser_contracts.parser_backends import DEFAULT_SERVICE_PARSER_BACKEND
from docmate_parser_contracts.parser_backends import ParserBackend

DEFAULT_PARSE_LANGUAGE = "en"


class ParsingServiceParseRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    language: str = DEFAULT_PARSE_LANGUAGE
    parser_backend: ParserBackend = Field(
        default=DEFAULT_SERVICE_PARSER_BACKEND,
        alias="parserBackend",
    )


class ParsingServiceParseResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    markdown: str
    canonical_json: dict[str, Any] = Field(alias="canonicalJson")
    metadata: dict[str, Any] = Field(default_factory=dict)
