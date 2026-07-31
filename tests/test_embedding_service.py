import asyncio

from backend.services import embedding_service


def test_embedding_artifact_and_cache_reuse(tmp_path, monkeypatch):
    artifact_path = tmp_path / "lesson.json"
    calls = []

    async def fake_embeddings(texts, model=None):
        calls.append(list(texts))
        return [[float(index + 1), 0.5] for index, _ in enumerate(texts)]

    monkeypatch.setattr(embedding_service, "embeddings_path", lambda _lesson_id: artifact_path)
    monkeypatch.setattr(embedding_service, "create_embeddings", fake_embeddings)
    chunks = [
        {"chunkId": "a", "contentHash": "hash-a", "text": "Token", "pageStart": 1},
        {"chunkId": "b", "contentHash": "hash-b", "text": "Attention", "pageStart": 2},
    ]

    first = asyncio.run(embedding_service.embed_lesson_chunks("lesson", chunks))
    second = asyncio.run(embedding_service.embed_lesson_chunks("lesson", chunks))

    assert first["dimensions"] == 2
    assert len(first["chunks"]) == 2
    assert second["chunks"] == first["chunks"]
    assert calls == [["Token", "Attention"]]
