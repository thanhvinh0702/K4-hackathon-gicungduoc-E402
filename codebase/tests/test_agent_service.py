import asyncio
import json

from backend.models import AgentAnswer
from backend.services import agent_service
from langgraph.errors import GraphRecursionError


def test_agent_search_tool_and_source_mapping(monkeypatch):
    captured = {}

    async def fake_retrieve(lesson_id, query, top_k=None):
        assert lesson_id == "lesson-a"
        assert query == "token"
        return [{
            "lessonId": "lesson-a",
            "lessonTitle": "AI",
            "chunkId": "page-3-chunk-1",
            "pageStart": 3,
            "pageEnd": 3,
            "title": "Token",
            "text": "Token là đơn vị văn bản.",
            "score": 0.91,
        }]

    class FakeAgent:
        def __init__(self, tools):
            self.tools = tools

        async def ainvoke(self, _input, config=None):
            captured["invoke_config"] = config
            payload = json.loads(await self.tools[0].ainvoke({"query": "token", "result_count": 2}))
            ref = payload["results"][0]["ref"]
            return {"structured_response": AgentAnswer(answer="Token là đơn vị văn bản.", source_refs=[ref])}

    def fake_create_agent(model, tools, **kwargs):
        captured["model"] = model
        captured["tool_names"] = [item.name for item in tools]
        captured.update(kwargs)
        return FakeAgent(tools)

    monkeypatch.setattr(agent_service, "retrieve_lesson_chunks", fake_retrieve)
    monkeypatch.setattr(agent_service, "get_chat_model", lambda: "fake-model")
    monkeypatch.setattr(agent_service, "create_agent", fake_create_agent)

    result = asyncio.run(agent_service.run_rag_agent("Token là gì?", lesson_id="lesson-a"))

    assert captured["tool_names"] == ["search_slides", "read_slide_page"]
    assert captured.get("response_format") is not None
    assert captured["invoke_config"] == {"recursion_limit": agent_service.settings.agent_recursion_limit}
    assert result["answer"] == "Token là đơn vị văn bản."
    assert result["sources"] == [{
        "lessonId": "lesson-a", "page": 3, "pageEnd": 3, "label": "Token", "score": 0.91,
    }]


def test_agent_falls_back_to_grounded_answer_on_recursion_limit(monkeypatch):
    async def fake_retrieve(lesson_id, query, top_k=None):
        return [{
            "lessonId": "lesson-a",
            "lessonTitle": "AI",
            "chunkId": "page-3-chunk-1",
            "pageStart": 3,
            "pageEnd": 3,
            "title": "Token",
            "text": "Token là đơn vị văn bản.",
            "score": 0.91,
        }]

    class LoopingAgent:
        def __init__(self, tools):
            self.tools = tools

        async def ainvoke(self, _input, config=None):
            await self.tools[0].ainvoke({"query": "token", "result_count": 2})
            raise GraphRecursionError("test recursion limit")

    async def fake_answer_with_context(question, sources):
        assert question == "Token là gì?"
        assert sources[0]["text"] == "Token là đơn vị văn bản."
        from backend.models import GroundedAnswer
        return GroundedAnswer(answer="Token là đơn vị văn bản.", source_ids=[1]), "fake-model"

    monkeypatch.setattr(agent_service, "retrieve_lesson_chunks", fake_retrieve)
    monkeypatch.setattr(agent_service, "get_chat_model", lambda: "fake-model")
    monkeypatch.setattr(
        agent_service,
        "create_agent",
        lambda model, tools, **kwargs: LoopingAgent(tools),
    )
    monkeypatch.setattr(agent_service, "answer_with_context", fake_answer_with_context)

    result = asyncio.run(agent_service.run_rag_agent("Token là gì?", lesson_id="lesson-a"))

    assert result["answer"] == "Token là đơn vị văn bản."
    assert result["sources"] == [{
        "lessonId": "lesson-a", "page": 3, "pageEnd": 3, "label": "Token", "score": 0.91,
    }]
