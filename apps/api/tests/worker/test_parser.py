from src.worker.parser import ParsedDocumentPayload


def test_parsed_document_payload_holds_markdown_and_json() -> None:
    parsed = ParsedDocumentPayload(
        markdown="# parsed",
        canonical_json={"document": {"source": "parsing_service"}},
    )

    assert parsed.markdown == "# parsed"
    assert parsed.canonical_json["document"]["source"] == "parsing_service"
