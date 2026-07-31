import math

from backend.config import settings
from backend.services.openai_service import create_embeddings
from backend.storage import embeddings_path, find_lesson, read_json, read_lessons


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        return 0.0
    dot_product = sum(a * b for a, b in zip(left, right, strict=True))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if not left_norm or not right_norm:
        return 0.0
    return dot_product / (left_norm * right_norm)


def rank_chunks(
    chunks: list[dict],
    query_embedding: list[float],
    top_k: int,
    min_score: float,
) -> list[dict]:
    ranked = []
    for chunk in chunks:
        score = cosine_similarity(query_embedding, chunk.get("embedding", []))
        if score >= min_score:
            ranked.append({**chunk, "score": score})
    ranked.sort(key=lambda item: item["score"], reverse=True)

    selected = []
    seen_hashes = set()
    for item in ranked:
        if item["contentHash"] in seen_hashes:
            continue
        selected.append(item)
        seen_hashes.add(item["contentHash"])
        if len(selected) >= top_k:
            break
    return selected


async def retrieve_lesson_chunks(lesson_id: str, question: str, top_k: int | None = None) -> list[dict]:
    lesson = find_lesson(lesson_id)
    if not lesson:
        raise FileNotFoundError("Không tìm thấy bài học.")
    artifact = read_json(embeddings_path(lesson_id))
    if not artifact or not artifact.get("chunks"):
        raise RuntimeError("Bài học chưa có embeddings. Hãy xử lý lại bài học trước.")
    if artifact.get("model") != settings.embedding_model:
        raise RuntimeError("Embedding cache dùng model cũ. Hãy xử lý lại bài học.")

    query_vectors = await create_embeddings([question], model=artifact["model"])
    ranked = rank_chunks(
        artifact["chunks"],
        query_vectors[0],
        top_k=top_k or settings.retrieval_top_k,
        min_score=settings.retrieval_min_score,
    )
    return [{**item, "lessonId": lesson_id, "lessonTitle": lesson["title"]} for item in ranked]


async def retrieve_library_chunks(question: str, top_k: int | None = None) -> list[dict]:
    candidates = []
    for lesson in read_lessons():
        artifact = read_json(embeddings_path(lesson["id"]))
        if not artifact or artifact.get("model") != settings.embedding_model:
            continue
        candidates.extend(
            {
                **chunk,
                "lessonId": lesson["id"],
                "lessonTitle": lesson["title"],
            }
            for chunk in artifact.get("chunks", [])
        )
    if not candidates:
        raise RuntimeError("Thư viện chưa có bài học đã xử lý embeddings.")

    query_vectors = await create_embeddings([question], model=settings.embedding_model)
    return rank_chunks(
        candidates,
        query_vectors[0],
        top_k=top_k or settings.retrieval_top_k,
        min_score=settings.retrieval_min_score,
    )
