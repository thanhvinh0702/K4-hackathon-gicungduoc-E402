import asyncio

from backend.models import GroundedAnswer
from backend.services import chat_service


def test_answer_sources_are_mapped_by_backend(monkeypatch):
    async def fake_answer(_question, _chunks):
        return GroundedAnswer(answer="Khái niệm nằm ở đây.", source_ids=[2, 2, 99]), "test-model"

    monkeypatch.setattr(chat_service, "answer_with_context", fake_answer)
    chunks = [
        {
            "lessonId": "lesson-a", "lessonTitle": "A", "pageStart": 1, "pageEnd": 1,
            "title": "Trang một", "score": 0.8, "text": "A",
        },
        {
            "lessonId": "lesson-b", "lessonTitle": "B", "pageStart": 7, "pageEnd": 7,
            "title": "Token", "score": 0.91, "text": "B",
        },
    ]

    result = asyncio.run(chat_service._answer_from_chunks(chunks, "Token là gì?"))

    assert result["model"] == "test-model"
    assert result["sources"] == [
        {"lessonId": "lesson-b", "page": 7, "pageEnd": 7, "label": "Token", "score": 0.91}
    ]
