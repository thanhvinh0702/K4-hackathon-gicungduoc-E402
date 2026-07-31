import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.services.processing_service import process_lesson
from backend.storage import read_lessons


async def main(lesson_id: str | None):
    lessons = read_lessons()
    selected = [lesson for lesson in lessons if lesson["id"] == lesson_id] if lesson_id else lessons
    if lesson_id and not selected:
        raise SystemExit(f"Không tìm thấy lesson {lesson_id}")
    for lesson in selected:
        print(f"Processing {lesson['id']} - {lesson['title']}")
        result = await process_lesson(lesson["id"])
        print(f"  status={result.get('status') if result else 'missing'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--lesson-id")
    arguments = parser.parse_args()
    asyncio.run(main(arguments.lesson_id))
