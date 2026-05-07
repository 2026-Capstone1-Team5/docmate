from __future__ import annotations

import shutil
from pathlib import Path
from typing import Annotated, Any

from fastapi import Depends
from fastapi import FastAPI
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic import Field

from scripts.document_ai_runtime import DocumentAIRuntime
from scripts.document_ai_runtime import create_work_dir
from scripts.document_ai_runtime import runtime


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
        return JSONResponse(status_code=503, content={"ready": False})
    return JSONResponse(status_code=200, content={"ready": True})


@app.post("/parse", response_model=ParseResponse)
async def parse(
    file: Annotated[UploadFile, File()],
    language: Annotated[str, Form()] = "en",
    document_ai_runtime: Annotated[DocumentAIRuntime, Depends(get_runtime)] = None,
) -> ParseResponse:
    if document_ai_runtime is None:
        document_ai_runtime = runtime

    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=415, detail="Only PDF uploads are supported.")

    safe_filename = Path(file.filename or "document.pdf").name
    if not safe_filename.lower().endswith(".pdf"):
        safe_filename = f"{safe_filename}.pdf"

    with create_work_dir() as temp_dir:
        work_dir = Path(temp_dir)
        input_path = work_dir / safe_filename
        with input_path.open("wb") as output:
            shutil.copyfileobj(file.file, output)

        payload = document_ai_runtime.parse_pdf(
            pdf_path=input_path,
            output_dir=work_dir / "output",
            language=language,
        )

    return ParseResponse(
        markdown=payload["markdown"],
        canonicalJson=payload["canonical_json"],
        metadata=payload["metadata"],
    )
