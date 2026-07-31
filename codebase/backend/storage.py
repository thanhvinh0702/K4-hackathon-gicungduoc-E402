import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.config import settings


UPLOADS_DIR = settings.uploads_dir
EXTRACTED_DIR = UPLOADS_DIR / "extracted"
EMBEDDINGS_DIR = UPLOADS_DIR / "embeddings"
METADATA_FILE = UPLOADS_DIR / "lessons.json"
_metadata_lock = threading.RLock()

for directory in (UPLOADS_DIR, EXTRACTED_DIR, EMBEDDINGS_DIR):
    directory.mkdir(parents=True, exist_ok=True)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def read_json(path: Path, fallback: Any = None) -> Any:
    try:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return fallback


def write_json_atomic(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    with temporary.open("w", encoding="utf-8") as file:
        json.dump(value, file, ensure_ascii=False, indent=2)
        file.write("\n")
        file.flush()
        os.fsync(file.fileno())
    temporary.replace(path)


def read_lessons() -> list[dict[str, Any]]:
    with _metadata_lock:
        return read_json(METADATA_FILE, [])


def write_lessons(lessons: list[dict[str, Any]]) -> None:
    with _metadata_lock:
        write_json_atomic(METADATA_FILE, lessons)


def find_lesson(lesson_id: str) -> dict[str, Any] | None:
    return next((lesson for lesson in read_lessons() if lesson.get("id") == lesson_id), None)


def update_lesson(lesson_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    with _metadata_lock:
        lessons = read_json(METADATA_FILE, [])
        for index, lesson in enumerate(lessons):
            if lesson.get("id") == lesson_id:
                lessons[index] = {**lesson, **patch, "updatedAt": utc_now()}
                write_json_atomic(METADATA_FILE, lessons)
                return lessons[index]
    return None


def pdf_path_for_lesson(lesson: dict[str, Any]) -> Path:
    return UPLOADS_DIR / Path(str(lesson["filename"])).name


def extracted_path(lesson_id: str) -> Path:
    return EXTRACTED_DIR / f"{lesson_id}.json"


def embeddings_path(lesson_id: str) -> Path:
    return EMBEDDINGS_DIR / f"{lesson_id}.json"
