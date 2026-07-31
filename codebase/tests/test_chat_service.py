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


def test_agentic_mode_reuses_preliminary_chunks(monkeypatch):
    chunks = [{"lessonId": "a", "text": "A"}]
    captured = {}

    async def fake_agent(question, **kwargs):
        captured["question"] = question
        captured.update(kwargs)
        return {"answer": "agent", "sources": [], "model": "agent-model"}

    monkeypatch.setattr(chat_service, "run_rag_agent", fake_agent)

    result = asyncio.run(
        chat_service._answer_with_mode(
            "So sánh A và B", chunks, "agentic_rag", lesson_id="lesson-a", top_k=4,
        )
    )

    assert result["answer"] == "agent"
    assert captured["initial_chunks"] is chunks
    assert captured["lesson_id"] == "lesson-a"
    assert captured["top_k"] == 4


def test_fast_mode_uses_direct_answer(monkeypatch):
    chunks = [{"lessonId": "a", "text": "A"}]

    async def fake_fast(answer_chunks, question):
        assert answer_chunks is chunks
        return {"answer": "fast", "sources": [], "model": "answer-model"}

    monkeypatch.setattr(chat_service, "_answer_from_chunks", fake_fast)

    result = asyncio.run(chat_service._answer_with_mode("Câu hỏi", chunks, "fast_rag"))

    assert result["answer"] == "fast"


def test_library_chat_forwards_selected_mode(monkeypatch):
    chunks = [{"lessonId": "a", "text": "A"}]
    captured = {}

    async def fake_retrieve(question, top_k):
        assert question == "Câu hỏi"
        assert top_k == 4
        return chunks

    async def fake_answer(question, answer_chunks, mode, **kwargs):
        captured.update(question=question, chunks=answer_chunks, mode=mode, **kwargs)
        return {"answer": "agent", "sources": [], "model": "agent-model"}

    monkeypatch.setattr(chat_service, "retrieve_library_chunks", fake_retrieve)
    monkeypatch.setattr(chat_service, "_answer_with_mode", fake_answer)

    result = asyncio.run(
        chat_service.chat_with_library("Câu hỏi", mode="agentic_rag", top_k=4)
    )

    assert result["answer"] == "agent"
    assert captured["chunks"] is chunks
    assert captured["mode"] == "agentic_rag"
    assert captured["top_k"] == 4
