from __future__ import annotations

import os
import shutil
from pathlib import Path
from typing import Annotated, Any

from fastapi import Depends
from fastapi import FastAPI
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic import Field

from scripts.document_ai_runtime import DocumentAIRuntime, ParserBackend
from scripts.document_ai_runtime import create_work_dir


class ParseResponse(BaseModel):
    markdown: str
    canonical_json: dict[str, Any] = Field(alias="canonicalJson")
    metadata: dict[str, Any]


app = FastAPI(title="DocMate Document AI", version="0.1.0")


def get_runtime() -> DocumentAIRuntime:
    return runtime


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "document-ai", "status": "ok"}


@app.get("/ready")
def ready(document_ai_runtime: Annotated[DocumentAIRuntime, Depends(get_runtime)]) -> JSONResponse:
    if not document_ai_runtime.ready:
        return JSONResponse(
            status_code=503,
            content={"ready": False, "state": "runtime_not_initialized"},
        )
    return JSONResponse(status_code=200, content={"ready": True, "state": "runtime_initialized"})


@app.post("/parse", response_model=ParseResponse)
async def parse(
    file: Annotated[UploadFile, File()],
    language: Annotated[str, Form()] = "en",
    parser_backend: Annotated[ParserBackend, Form(alias="parserBackend")] = "document_ai",
    document_ai_runtime: Annotated[DocumentAIRuntime, Depends(get_runtime)] = None,
) -> ParseResponse:
    if document_ai_runtime is None:
        document_ai_runtime = runtime

    if parser_backend in {"document_ai", "pdftotext"} and file.content_type not in {
        "application/pdf",
        "application/octet-stream",
    }:
        raise HTTPException(status_code=415, detail=f"{parser_backend} only supports PDF uploads.")

    safe_filename = Path(file.filename or "document").name
    if parser_backend in {"document_ai", "pdftotext"} and not safe_filename.lower().endswith(".pdf"):
        safe_filename = f"{safe_filename}.pdf"

    with create_work_dir() as temp_dir:
        work_dir = Path(temp_dir)
        input_path = work_dir / safe_filename
        with input_path.open("wb") as output:
            shutil.copyfileobj(file.file, output)

        try:
            payload = await run_in_threadpool(
                document_ai_runtime.parse_document,
                input_path=input_path,
                output_dir=work_dir / "output",
                parser_backend=parser_backend,
                language=language,
            )
        except RuntimeError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    return ParseResponse(
        markdown=payload["markdown"],
        canonicalJson=payload["canonical_json"],
        metadata=payload["metadata"],
    )


runtime = DocumentAIRuntime(
    pdftotext_command=os.getenv("PDFTOTEXT_COMMAND", "pdftotext"),
    parser_timeout_seconds=int(os.getenv("PARSER_TIMEOUT_SECONDS", "300")),
)
