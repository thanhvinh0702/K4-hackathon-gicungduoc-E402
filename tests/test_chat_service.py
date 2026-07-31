import asyncio

from backend.models import GroundedAnswer, RouteDecision
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


def _decision(route):
    return RouteDecision(route=route)


def test_out_of_scope_stops_without_answer_model_or_agent(monkeypatch):
    async def fake_route(*_args):
        return _decision("out_of_scope"), "router-model"

    async def must_not_run(*_args, **_kwargs):
        raise AssertionError("Không được gọi luồng trả lời sau out_of_scope")

    monkeypatch.setattr(chat_service, "route_question", fake_route)
    monkeypatch.setattr(chat_service, "answer_with_context", must_not_run)
    monkeypatch.setattr(chat_service, "run_rag_agent", must_not_run)

    result = asyncio.run(chat_service._route_and_answer("Nấu phở?", [], "Thư viện AI"))

    assert result["answer"] == chat_service.OUT_OF_SCOPE_ANSWER
    assert result["sources"] == []
    assert result["model"] == "router-model"


def test_clarify_returns_default_question(monkeypatch):
    async def fake_route(*_args):
        return _decision("clarify"), "router-model"

    monkeypatch.setattr(chat_service, "route_question", fake_route)

    result = asyncio.run(chat_service._route_and_answer("Trang đó nói gì?", [], "Thư viện"))

    assert result["answer"] == chat_service.CLARIFY_ANSWER
    assert result["sources"] == []


def test_agentic_route_reuses_preliminary_chunks(monkeypatch):
    chunks = [{"lessonId": "a", "text": "A"}]
    captured = {}

    async def fake_route(*_args):
        return _decision("agentic_rag"), "router-model"

    async def fake_agent(question, **kwargs):
        captured["question"] = question
        captured.update(kwargs)
        return {"answer": "agent", "sources": [], "model": "agent-model"}

    monkeypatch.setattr(chat_service, "route_question", fake_route)
    monkeypatch.setattr(chat_service, "run_rag_agent", fake_agent)

    result = asyncio.run(
        chat_service._route_and_answer(
            "So sánh A và B", chunks, "Thư viện", lesson_id="lesson-a", top_k=4,
        )
    )

    assert result["answer"] == "agent"
    assert captured["initial_chunks"] is chunks
    assert captured["lesson_id"] == "lesson-a"
    assert captured["top_k"] == 4


def test_fast_route_uses_direct_answer(monkeypatch):
    chunks = [{"lessonId": "a", "text": "A"}]

    async def fake_route(*_args):
        return _decision("fast_rag"), "router-model"

    async def fake_fast(answer_chunks, question):
        assert answer_chunks is chunks
        return {"answer": "fast", "sources": [], "model": "answer-model"}

    monkeypatch.setattr(chat_service, "route_question", fake_route)
    monkeypatch.setattr(chat_service, "_answer_from_chunks", fake_fast)

    result = asyncio.run(chat_service._route_and_answer("Câu hỏi", chunks, "Thư viện"))

    assert result["answer"] == "fast"
