import logging

from backend.config import settings
from backend.services.agent_service import run_rag_agent
from backend.services.openai_service import answer_with_context, route_question
from backend.services.retrieval_service import retrieve_lesson_chunks, retrieve_library_chunks
from backend.storage import find_lesson, read_lessons


logger = logging.getLogger("uvicorn.error")

OUT_OF_SCOPE_ANSWER = "Mình chưa tìm thấy nội dung này trong các bài học đã tải lên. Bạn có thể hỏi về một chủ đề khác có trong thư viện."
CLARIFY_ANSWER = "Bạn có thể nói rõ bài học hoặc chủ đề muốn tìm không?"


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


async def _route_and_answer(
    question: str,
    chunks: list[dict],
    scope: str,
    lesson_id: str | None = None,
    top_k: int | None = None,
) -> dict:
    try:
        decision, router_model = await route_question(question, chunks, scope)
    except Exception as error:
        logger.warning("Router failed; falling back to Fast RAG: %s", error)
        return await _answer_from_chunks(chunks, question)

    logger.info("RAG route=%s", decision.route)
    if decision.route == "out_of_scope":
        return {"answer": OUT_OF_SCOPE_ANSWER, "sources": [], "model": router_model}

    if decision.route == "clarify":
        return {
            "answer": CLARIFY_ANSWER,
            "sources": [],
            "model": router_model,
        }

    if decision.route == "fast_rag":
        return await _answer_from_chunks(chunks, question)

    return await run_rag_agent(
        question,
        lesson_id=lesson_id,
        top_k=top_k,
        initial_chunks=chunks,
    )


async def chat_with_lesson(lesson_id: str, question: str, top_k: int | None = None) -> dict:
    preliminary_top_k = min(top_k or settings.retrieval_top_k, 6)
    chunks = await retrieve_lesson_chunks(lesson_id, question, top_k=preliminary_top_k)
    lesson = find_lesson(lesson_id)
    scope = f'Chỉ bài học "{lesson["title"]}".' if lesson else "Chỉ bài học hiện tại."
    return await _route_and_answer(
        question,
        chunks,
        scope,
        lesson_id=lesson_id,
        top_k=top_k,
    )


async def chat_with_library(question: str, top_k: int | None = None) -> dict:
    preliminary_top_k = min(top_k or settings.retrieval_top_k, 6)
    chunks = await retrieve_library_chunks(question, top_k=preliminary_top_k)
    lesson_titles = [
        lesson["title"]
        for lesson in read_lessons()
        if lesson.get("status") == "ready"
    ]
    scope = "Toàn bộ thư viện: " + ", ".join(lesson_titles)
    return await _route_and_answer(question, chunks, scope, top_k=top_k)
