from backend.config import settings
from backend.services.agent_service import run_rag_agent
from backend.services.openai_service import answer_with_context
from backend.services.retrieval_service import retrieve_lesson_chunks, retrieve_library_chunks


async def _answer_from_chunks(chunks: list[dict], question: str) -> dict:
    if not chunks:
        return {
            "answer": "Mình chưa tìm thấy nội dung đủ liên quan trong bài học để trả lời câu hỏi này.",
            "sources": [],
            "model": "retrieval-only",
        }

    structured_answer, model = await answer_with_context(question, chunks)
    indexes = []
    for source_id in structured_answer.source_ids:
        index = source_id - 1
        if 0 <= index < len(chunks) and index not in indexes:
            indexes.append(index)
    if not indexes:
        indexes = list(range(min(2, len(chunks))))

    sources = []
    seen_pages = set()
    for index in indexes:
        chunk = chunks[index]
        page_key = (chunk["lessonId"], chunk["pageStart"], chunk["pageEnd"])
        if page_key in seen_pages:
            continue
        sources.append(
            {
                "lessonId": chunk["lessonId"],
                "page": chunk["pageStart"],
                "pageEnd": chunk["pageEnd"],
                "label": chunk["title"],
                "score": round(chunk["score"], 4),
            }
        )
        seen_pages.add(page_key)
    return {"answer": structured_answer.answer, "sources": sources, "model": model}


async def _answer_with_mode(
    question: str,
    chunks: list[dict],
    mode: str,
    lesson_id: str | None = None,
    top_k: int | None = None,
) -> dict:
    if mode == "fast_rag":
        return await _answer_from_chunks(chunks, question)

    return await run_rag_agent(
        question,
        lesson_id=lesson_id,
        top_k=top_k,
        initial_chunks=chunks,
    )


async def chat_with_lesson(
    lesson_id: str,
    question: str,
    mode: str = "fast_rag",
    top_k: int | None = None,
) -> dict:
    preliminary_top_k = min(top_k or settings.retrieval_top_k, 6)
    chunks = await retrieve_lesson_chunks(lesson_id, question, top_k=preliminary_top_k)
    return await _answer_with_mode(
        question,
        chunks,
        mode,
        lesson_id=lesson_id,
        top_k=top_k,
    )


async def chat_with_library(
    question: str,
    mode: str = "fast_rag",
    top_k: int | None = None,
) -> dict:
    preliminary_top_k = min(top_k or settings.retrieval_top_k, 6)
    chunks = await retrieve_library_chunks(question, top_k=preliminary_top_k)
    return await _answer_with_mode(question, chunks, mode, top_k=top_k)
