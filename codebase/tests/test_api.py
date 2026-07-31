import asyncio
from dataclasses import replace

import httpx2

import backend.app as app_module
from backend.app import app
from backend.config import settings
from backend.storage import read_lessons


async def request(method: str, path: str, **kwargs):
    transport = httpx2.ASGITransport(app=app)
    async with httpx2.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, **kwargs)


def test_health_and_lessons_api():
    health = asyncio.run(request("GET", "/api/health"))
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    response = asyncio.run(request("GET", "/api/lessons"))
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_chat_requires_api_key_when_not_configured(monkeypatch):
    monkeypatch.setattr(app_module, "settings", replace(settings, openai_api_key=""))
    lessons = read_lessons()
    if not lessons:
        return
    response = asyncio.run(
        request(
            "POST",
            f"/api/lessons/{lessons[0]['id']}/chat",
            json={"question": "Tóm tắt bài học"},
        )
    )
    assert response.status_code in {409, 503}


def test_unknown_lesson_is_404():
    response = asyncio.run(
        request("POST", "/api/lessons/not-found/chat", json={"question": "Nội dung gì?"})
    )
    assert response.status_code == 404


def test_library_chat_requires_api_key_when_not_configured(monkeypatch):
    monkeypatch.setattr(app_module, "settings", replace(settings, openai_api_key=""))
    response = asyncio.run(request("POST", "/api/chat", json={"question": "Tóm tắt thư viện"}))
    assert response.status_code == 503


def test_chat_rejects_unknown_mode():
    response = asyncio.run(
        request(
            "POST",
            "/api/chat",
            json={"question": "Tóm tắt thư viện", "mode": "auto"},
        )
    )
    assert response.status_code == 422
