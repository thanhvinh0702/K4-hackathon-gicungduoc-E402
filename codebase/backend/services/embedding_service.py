from backend.config import settings
from backend.services.openai_service import create_embeddings
from backend.storage import embeddings_path, read_json, utc_now, write_json_atomic


async def embed_lesson_chunks(lesson_id: str, chunks: list[dict]) -> dict:
    path = embeddings_path(lesson_id)
    cached = read_json(path, {}) or {}
    reusable: dict[str, list[float]] = {}
    if cached.get("model") == settings.embedding_model:
        reusable = {
            item["contentHash"]: item["embedding"]
            for item in cached.get("chunks", [])
            if item.get("contentHash") and item.get("embedding")
        }

    missing = [chunk for chunk in chunks if chunk["contentHash"] not in reusable]
    for start in range(0, len(missing), settings.embedding_batch_size):
        batch = missing[start : start + settings.embedding_batch_size]
        vectors = await create_embeddings([item["text"] for item in batch])
        if len(vectors) != len(batch):
            raise RuntimeError("Embedding API trả về số vector không khớp số chunk.")
        for item, vector in zip(batch, vectors, strict=True):
            reusable[item["contentHash"]] = vector

    embedded_chunks = [
        {**chunk, "embedding": reusable[chunk["contentHash"]]}
        for chunk in chunks
    ]
    artifact = {
        "version": 1,
        "lessonId": lesson_id,
        "model": settings.embedding_model,
        "dimensions": len(embedded_chunks[0]["embedding"]) if embedded_chunks else 0,
        "createdAt": utc_now(),
        "chunks": embedded_chunks,
    }
    write_json_atomic(path, artifact)
    return artifact
