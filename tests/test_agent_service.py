import asyncio
import json

from backend.models import AgentAnswer
from backend.services import agent_service


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
    assert result["answer"] == "Token là đơn vị văn bản."
    assert result["sources"] == [{
        "lessonId": "lesson-a", "page": 3, "pageEnd": 3, "label": "Token", "score": 0.91,
    }]
