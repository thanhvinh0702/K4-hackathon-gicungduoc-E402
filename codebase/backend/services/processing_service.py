from backend.config import settings
from backend.services.chunk_service import build_chunks
from backend.services.embedding_service import embed_lesson_chunks
from backend.services.openai_service import AIConfigurationError, has_api_key
from backend.services.pdf_service import extract_pdf_pages
from backend.storage import (
    extracted_path,
    find_lesson,
    pdf_path_for_lesson,
    update_lesson,
    utc_now,
    write_json_atomic,
)


async def process_lesson(lesson_id: str) -> dict | None:
    lesson = find_lesson(lesson_id)
    if not lesson:
        return None
    try:
        update_lesson(lesson_id, {"status": "processing", "processingStep": "extracting", "processingError": None})
        # Poppler is fast for slide PDFs and invoking it from a worker thread can
        # deadlock on some sandboxed Linux environments. Keep this subprocess on
        # the event-loop thread; processing itself already runs as a background task.
        document = extract_pdf_pages(pdf_path_for_lesson(lesson), lesson_id)
        document["extractedAt"] = utc_now()
        update_lesson(lesson_id, {"status": "processing", "processingStep": "chunking"})
        chunks = build_chunks(
            document,
            max_chars=settings.max_chunk_chars,
            overlap_chars=settings.chunk_overlap_chars,
        )
        document["chunkCount"] = len(chunks)
        document["chunks"] = chunks
        write_json_atomic(extracted_path(lesson_id), document)
        update_lesson(
            lesson_id,
            {
                "pageCount": document["pageCount"],
                "chunkCount": len(chunks),
                "status": "processing",
                "processingStep": "embedding",
            },
        )
        if not has_api_key():
            return update_lesson(
                lesson_id,
                {
                    "status": "needs_api_key",
                    "processingStep": "embedding",
                    "processingError": "OPENAI_API_KEY chưa được cấu hình.",
                },
            )
        await embed_lesson_chunks(lesson_id, chunks)
        return update_lesson(
            lesson_id,
            {"status": "ready", "processingStep": "complete", "processingError": None, "processedAt": utc_now()},
        )
    except AIConfigurationError as error:
        return update_lesson(
            lesson_id,
            {"status": "needs_api_key", "processingStep": "embedding", "processingError": str(error)},
        )
    except Exception as error:
        return update_lesson(
            lesson_id,
            {"status": "failed", "processingStep": "failed", "processingError": str(error)},
        )
