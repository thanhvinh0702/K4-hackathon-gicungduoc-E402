import pytest

from backend.services.retrieval_service import cosine_similarity, rank_chunks


def test_cosine_similarity():
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == pytest.approx(1.0)
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == pytest.approx(0.0)
    assert cosine_similarity([], []) == 0.0


def test_rank_chunks_orders_and_filters():
    chunks = [
        {"chunkId": "a", "contentHash": "a", "embedding": [1.0, 0.0]},
        {"chunkId": "b", "contentHash": "b", "embedding": [0.8, 0.2]},
        {"chunkId": "c", "contentHash": "c", "embedding": [0.0, 1.0]},
    ]
    ranked = rank_chunks(chunks, [1.0, 0.0], top_k=2, min_score=0.2)
    assert [item["chunkId"] for item in ranked] == ["a", "b"]
    assert ranked[0]["score"] >= ranked[1]["score"]
