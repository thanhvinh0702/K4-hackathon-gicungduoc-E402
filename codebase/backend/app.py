import os
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.models import ChatRequest, ChatResponse
from backend.services.chat_service import chat_with_lesson, chat_with_library
from backend.services.openai_service import AIConfigurationError
from backend.services.processing_service import process_lesson
from backend.storage import (
    UPLOADS_DIR,
    embeddings_path,
    find_lesson,
    read_lessons,
    utc_now,
    write_lessons,
)


app = FastAPI(title="VLearn API", version="1.0.0")


def public_lesson(lesson: dict) -> dict:
    normalized = dict(lesson)
    if "status" not in normalized:
        normalized["status"] = "ready" if embeddings_path(normalized["id"]).exists() else "not_processed"
    return normalized


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "aiConfigured": bool(settings.openai_api_key),
        "customOpenAIBaseUrl": bool(settings.openai_base_url),
        "chatModel": settings.chat_model,
        "embeddingModel": settings.embedding_model,
    }


@app.get("/api/lessons")
async def list_lessons():
    lessons = sorted(read_lessons(), key=lambda item: item.get("createdAt", ""), reverse=True)
    return [public_lesson(lesson) for lesson in lessons]


@app.get("/api/lessons/{lesson_id}/status")
async def lesson_status(lesson_id: str):
    lesson = find_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học.")
    return {
        "lessonId": lesson_id,
        "status": public_lesson(lesson)["status"],
        "step": lesson.get("processingStep"),
        "error": lesson.get("processingError"),
        "pageCount": lesson.get("pageCount"),
        "chunkCount": lesson.get("chunkCount"),
    }


@app.post("/api/lessons/{lesson_id}/reprocess")
async def reprocess_lesson(lesson_id: str, background_tasks: BackgroundTasks):
    lesson = find_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học.")
    background_tasks.add_task(process_lesson, lesson_id)
    return {"lessonId": lesson_id, "status": "processing"}


@app.post("/api/lessons", status_code=201)
async def upload_lesson(
    background_tasks: BackgroundTasks,
    pdf: UploadFile = File(...),
    title: str | None = Form(default=None),
):
    original_name = pdf.filename or "document.pdf"
    if Path(original_name).suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận tệp PDF.")
    if pdf.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Content-Type của tệp không hợp lệ.")

    lesson_id = str(uuid.uuid4())
    filename = f"{lesson_id}.pdf"
    final_path = UPLOADS_DIR / filename
    temporary_path = UPLOADS_DIR / f".{lesson_id}.upload"
    total_size = 0
    signature = b""
    try:
        with temporary_path.open("wb") as output:
            while chunk := await pdf.read(1024 * 1024):
                total_size += len(chunk)
                if total_size > settings.max_upload_bytes:
                    raise HTTPException(status_code=413, detail="Tệp vượt quá giới hạn 50 MB.")
                if len(signature) < 5:
                    signature = (signature + chunk)[:5]
                output.write(chunk)
        if signature != b"%PDF-":
            raise HTTPException(status_code=400, detail="Tệp tải lên không phải PDF hợp lệ.")
        os.replace(temporary_path, final_path)
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise
    finally:
        await pdf.close()

    fallback_title = Path(original_name).stem
    clean_title = (title or fallback_title).strip()[:120] or fallback_title
    lesson = {
        "id": lesson_id,
        "title": clean_title,
        "originalName": original_name,
        "filename": filename,
        "size": total_size,
        "createdAt": utc_now(),
        "url": f"/uploads/{filename}",
        "status": "processing",
        "processingStep": "queued",
        "processingError": None,
    }
    lessons = read_lessons()
    lessons.append(lesson)
    write_lessons(lessons)
    background_tasks.add_task(process_lesson, lesson_id)
    return lesson


@app.post("/api/lessons/{lesson_id}/chat", response_model=ChatResponse)
async def lesson_chat(lesson_id: str, request: ChatRequest):
    lesson = find_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học.")
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="Backend chưa được cấu hình OPENAI_API_KEY.")
    if not embeddings_path(lesson_id).exists():
        raise HTTPException(status_code=409, detail="Bài học chưa xử lý embeddings. Hãy gọi reprocess trước.")
    try:
        return await chat_with_lesson(
            lesson_id,
            request.question.strip(),
            mode=request.mode,
            top_k=request.top_k,
        )
    except AIConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Không thể gọi dịch vụ AI: {error}") from error


@app.post("/api/chat", response_model=ChatResponse)
async def library_chat(request: ChatRequest):
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="Backend chưa được cấu hình OPENAI_API_KEY.")
    try:
        return await chat_with_library(
            request.question.strip(),
            mode=request.mode,
            top_k=request.top_k,
        )
    except AIConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Không thể gọi dịch vụ AI: {error}") from error


@app.get("/uploads/{filename}")
async def serve_pdf(filename: str):
    safe_name = Path(filename).name
    if safe_name != filename or Path(safe_name).suffix.lower() != ".pdf":
        raise HTTPException(status_code=404, detail="Không tìm thấy tệp.")
    path = UPLOADS_DIR / safe_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Không tìm thấy tệp.")
    return FileResponse(path, media_type="application/pdf", headers={"Content-Disposition": "inline"})


app.mount("/", StaticFiles(directory=settings.public_dir, html=True), name="public")
