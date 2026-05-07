from src.config import get_settings
from src.database import SessionLocal
from src.model_registry import load_model_registry
from src.parser_backends import ParserBackend
from src.queueing.dependencies import get_parse_job_queue
from src.storage.dependencies import get_object_storage
from src.worker.parser import AIParsingServiceParser, WorkerParser
from src.worker.runner import WorkerRunner


def _build_parsers() -> dict[ParserBackend, WorkerParser]:
    settings = get_settings()
    if not settings.parsing_service_url:
        msg = "parsing_service_url is required when worker parser backends are enabled"
        raise RuntimeError(msg)

    return {
        backend: AIParsingServiceParser(
            parser_backend=backend,
            service_url=settings.parsing_service_url,
            timeout_seconds=settings.parsing_service_timeout_seconds,
        )
        for backend in settings.enabled_parser_backends
    }


def main() -> None:
    settings = get_settings()
    load_model_registry()
    runner = WorkerRunner(
        session_factory=SessionLocal,
        storage=get_object_storage(),
        queue=get_parse_job_queue(),
        parsers=_build_parsers(),
        temp_root=settings.worker_temp_root,
    )
    runner.run_forever(timeout_seconds=settings.worker_poll_timeout_seconds)


if __name__ == "__main__":
    main()
