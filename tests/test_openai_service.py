from dataclasses import replace
import asyncio
from types import SimpleNamespace

from backend.config import settings
from backend.models import GroundedAnswer, RouteDecision
from backend.services import openai_service


def test_custom_base_url_is_passed_to_openai_client(monkeypatch):
    captured = {}
    fake_client = object()

    def fake_openai(**kwargs):
        captured.update(kwargs)
        return fake_client

    monkeypatch.setattr(
        openai_service,
        "settings",
        replace(
            settings,
            openai_api_key="test-key",
            openai_base_url="https://gateway.example.com/v1",
        ),
    )
    monkeypatch.setattr(openai_service, "AsyncOpenAI", fake_openai)
    monkeypatch.setattr(openai_service, "_client", None)

    assert openai_service.get_client() is fake_client
    assert captured["api_key"] == "test-key"
    assert captured["base_url"] == "https://gateway.example.com/v1"


def test_empty_base_url_uses_sdk_default(monkeypatch):
    captured = {}

    def fake_openai(**kwargs):
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(
        openai_service,
        "settings",
        replace(settings, openai_api_key="test-key", openai_base_url=""),
    )
    monkeypatch.setattr(openai_service, "AsyncOpenAI", fake_openai)
    monkeypatch.setattr(openai_service, "_client", None)

    openai_service.get_client()
    assert "base_url" not in captured


def test_chat_model_receives_custom_base_url(monkeypatch):
    captured = {}
    fake_model = object()

    def fake_chat_openai(**kwargs):
        captured.update(kwargs)
        return fake_model

    monkeypatch.setattr(
        openai_service,
        "settings",
        replace(
            settings,
            openai_api_key="test-key",
            openai_base_url="https://gateway.example/v1",
            chat_model="openrouter/qwen/test",
        ),
    )
    monkeypatch.setattr(openai_service, "ChatOpenAI", fake_chat_openai)
    monkeypatch.setattr(openai_service, "_chat_model", None)

    assert openai_service.get_chat_model() is fake_model
    assert captured["base_url"] == "https://gateway.example/v1"
    assert captured["extra_body"] == {"reasoning": {"enabled": False}}


def test_answer_uses_function_calling_schema(monkeypatch):
    captured = {}

    class FakeStructuredModel:
        async def ainvoke(self, messages):
            captured["messages"] = messages
            return {
                "parsed": GroundedAnswer(answer="Token là đơn vị văn bản.", source_ids=[1]),
                "parsing_error": None,
            }

    class FakeChatModel:
        def with_structured_output(self, schema, **kwargs):
            captured["schema"] = schema
            captured.update(kwargs)
            return FakeStructuredModel()

    monkeypatch.setattr(openai_service, "get_chat_model", lambda: FakeChatModel())
    sources = [{
        "lessonTitle": "AI", "pageStart": 3, "pageEnd": 3,
        "title": "Token", "text": "Token là đơn vị văn bản.",
    }]

    result, model = asyncio.run(openai_service.answer_with_context("Token là gì?", sources))

    assert result.source_ids == [1]
    assert model == settings.chat_model
    assert captured["schema"] is GroundedAnswer
    assert captured["method"] == "function_calling"
    assert captured["include_raw"] is True


def test_router_uses_structured_output(monkeypatch):
    captured = {}
    decision = RouteDecision(route="fast_rag")

    class FakeStructuredModel:
        async def ainvoke(self, messages):
            captured["messages"] = messages
            return {"parsed": decision, "parsing_error": None}

    class FakeRouterModel:
        def with_structured_output(self, schema, **kwargs):
            captured["schema"] = schema
            captured.update(kwargs)
            return FakeStructuredModel()

    monkeypatch.setattr(openai_service, "get_router_model", lambda: FakeRouterModel())
    sources = [{
        "lessonTitle": "AI", "pageStart": 13, "title": "Token",
        "text": "Token là đơn vị văn bản.", "score": 0.9,
    }]

    result, model = asyncio.run(
        openai_service.route_question("Token là gì?", sources, "Bài học AI")
    )

    assert result is decision
    assert model == settings.router_model
    assert captured["schema"] is RouteDecision
    assert captured["method"] == "function_calling"
    assert captured["include_raw"] is True
    assert "Token là đơn vị văn bản" in captured["messages"][1][1]


def test_router_accepts_raw_normalized_tool_arguments(monkeypatch):
    payload = {
        "route": "agentic_rag",
    }

    class FakeStructuredModel:
        async def ainvoke(self, messages):
            raw = SimpleNamespace(
                tool_calls=[{"name": "RouteDecision", "args": payload}],
                additional_kwargs={},
                content="",
            )
            return {"raw": raw, "parsed": None, "parsing_error": None}

    class FakeRouterModel:
        def with_structured_output(self, schema, **kwargs):
            return FakeStructuredModel()

    monkeypatch.setattr(openai_service, "get_router_model", lambda: FakeRouterModel())
    decision, _ = asyncio.run(
        openai_service.route_question("So sánh Rule và Agent", [], "Thư viện AI")
    )

    assert isinstance(decision, RouteDecision)
    assert decision.route == "agentic_rag"


def test_router_accepts_json_in_raw_content(monkeypatch):
    raw = SimpleNamespace(
        tool_calls=[],
        additional_kwargs={},
        content='```json\n{"route":"fast_rag"}\n```',
    )

    class FakeStructuredModel:
        async def ainvoke(self, messages):
            return {"raw": raw, "parsed": None, "parsing_error": None}

    class FakeRouterModel:
        def with_structured_output(self, schema, **kwargs):
            return FakeStructuredModel()

    monkeypatch.setattr(openai_service, "get_router_model", lambda: FakeRouterModel())
    decision, _ = asyncio.run(
        openai_service.route_question("Token là gì?", [], "Thư viện AI")
    )

    assert isinstance(decision, RouteDecision)
    assert decision.route == "fast_rag"
