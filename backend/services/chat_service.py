from backend.services.openai_service import answer_with_context
from backend.services.agent_service import run_rag_agent


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


async def chat_with_lesson(lesson_id: str, question: str, top_k: int | None = None) -> dict:
    return await run_rag_agent(question, lesson_id=lesson_id, top_k=top_k)


async def chat_with_library(question: str, top_k: int | None = None) -> dict:
    return await run_rag_agent(question, top_k=top_k)
