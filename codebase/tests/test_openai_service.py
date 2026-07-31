from dataclasses import replace
import asyncio

from backend.config import settings
from backend.models import GroundedAnswer
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
