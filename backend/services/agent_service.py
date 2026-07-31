import json

from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from langchain.tools import tool
from langgraph.errors import GraphRecursionError

from backend.config import settings
from backend.models import AgentAnswer
from backend.services.openai_service import answer_with_context, get_chat_model
from backend.services.retrieval_service import retrieve_lesson_chunks, retrieve_library_chunks
from backend.storage import extracted_path, find_lesson, read_json, read_lessons


AGENT_SYSTEM_PROMPT = """Bạn là trợ lý Agentic RAG của VLearn.

Mục tiêu: trả lời câu hỏi chỉ bằng bằng chứng lấy từ các retrieval tools.

Quy tắc:
- Luôn gọi search_slides ít nhất một lần trước khi trả lời câu hỏi về tài liệu.
- Nếu kết quả chưa đủ, đổi query hoặc gọi read_slide_page để đọc đúng trang.
- Dùng tối đa 3 lượt retrieval tools. Không gọi lại cùng một query nếu không có lý do.
- Không dùng kiến thức bên ngoài để bổ sung dữ kiện mà tài liệu không có.
- source_refs phải được sao chép chính xác từ trường ref do tools trả về.
- Nếu bằng chứng không đủ, nói rõ và trả source_refs rỗng.
- Trả lời bằng tiếng Việt, rõ ràng và súc tích.
"""


def _source_from_chunk(chunk: dict) -> tuple[str, dict]:
    ref = f"{chunk['lessonId']}:p{chunk['pageStart']}:{chunk['chunkId']}"
    source = {
        "lessonId": chunk["lessonId"],
        "page": chunk["pageStart"],
        "pageEnd": chunk["pageEnd"],
        "label": chunk["title"],
        "score": round(chunk.get("score", 0.0), 4),
    }
    return ref, source


async def run_rag_agent(
    question: str,
    lesson_id: str | None = None,
    top_k: int | None = None,
) -> dict:
    source_registry: dict[str, dict] = {}
    evidence_registry: dict[str, dict] = {}
    retrieval_calls = 0
    max_results = min(top_k or settings.retrieval_top_k, 6)

    @tool
    async def search_slides(query: str, result_count: int = 4) -> str:
        """Semantic search trong slide. Dùng query ngắn, rõ nghĩa; có thể đổi query nếu kết quả chưa đủ."""
        nonlocal retrieval_calls
        if retrieval_calls >= 3:
            return json.dumps({"error": "Đã đạt giới hạn 3 lượt retrieval."}, ensure_ascii=False)
        retrieval_calls += 1
        limit = max(1, min(result_count, max_results))
        chunks = (
            await retrieve_lesson_chunks(lesson_id, query, top_k=limit)
            if lesson_id
            else await retrieve_library_chunks(query, top_k=limit)
        )
        results = []
        for chunk in chunks:
            ref, source = _source_from_chunk(chunk)
            source_registry[ref] = source
            evidence_registry[ref] = chunk
            results.append(
                {
                    "ref": ref,
                    "lesson": chunk["lessonTitle"],
                    "page": chunk["pageStart"],
                    "title": chunk["title"],
                    "score": round(chunk["score"], 4),
                    "text": chunk["text"],
                }
            )
        return json.dumps({"results": results}, ensure_ascii=False)

    @tool
    async def read_slide_page(page: int, target_lesson_id: str = "") -> str:
        """Đọc toàn bộ text của một trang khi search result bị thiếu ngữ cảnh. Cần target_lesson_id khi hỏi toàn thư viện."""
        nonlocal retrieval_calls
        if retrieval_calls >= 3:
            return json.dumps({"error": "Đã đạt giới hạn 3 lượt retrieval."}, ensure_ascii=False)
        retrieval_calls += 1
        resolved_lesson_id = lesson_id or target_lesson_id
        if not resolved_lesson_id:
            return json.dumps({"error": "Thiếu target_lesson_id."}, ensure_ascii=False)
        if lesson_id and target_lesson_id and target_lesson_id != lesson_id:
            return json.dumps({"error": "Không được đọc ngoài bài học hiện tại."}, ensure_ascii=False)
        lesson = find_lesson(resolved_lesson_id)
        document = read_json(extracted_path(resolved_lesson_id))
        if not lesson or not document:
            return json.dumps({"error": "Không tìm thấy bài học hoặc extracted text."}, ensure_ascii=False)
        page_data = next((item for item in document.get("pages", []) if item.get("page") == page), None)
        if not page_data:
            return json.dumps({"error": "Không tìm thấy trang."}, ensure_ascii=False)
        ref = f"{resolved_lesson_id}:page:{page}"
        source_registry[ref] = {
            "lessonId": resolved_lesson_id,
            "page": page,
            "pageEnd": page,
            "label": page_data["title"],
            "score": 1.0,
        }
        evidence_registry[ref] = {
            "lessonId": resolved_lesson_id,
            "lessonTitle": lesson["title"],
            "pageStart": page,
            "pageEnd": page,
            "title": page_data["title"],
            "text": page_data["text"],
        }
        return json.dumps(
            {
                "ref": ref,
                "lesson": lesson["title"],
                "page": page,
                "title": page_data["title"],
                "text": page_data["text"],
            },
            ensure_ascii=False,
        )

    tools = [search_slides, read_slide_page]
    scope = "Chỉ tìm trong bài học hiện tại." if lesson_id else "Có thể tìm trên toàn bộ thư viện."
    if not lesson_id:
        @tool
        def list_lessons() -> str:
            """Liệt kê các bài học đã sẵn sàng, gồm lesson ID, tiêu đề và số trang."""
            lessons = [
                {"lessonId": item["id"], "title": item["title"], "pageCount": item.get("pageCount")}
                for item in read_lessons()
                if item.get("status") == "ready"
            ]
            return json.dumps({"lessons": lessons}, ensure_ascii=False)

        tools.append(list_lessons)

    agent = create_agent(
        model=get_chat_model(),
        tools=tools,
        system_prompt=f"{AGENT_SYSTEM_PROMPT}\nPhạm vi: {scope}",
        response_format=ToolStrategy(AgentAnswer),
        name="vlearn_rag_agent",
    )
    try:
        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": question}]},
            config={"recursion_limit": settings.agent_recursion_limit},
        )
        structured = result.get("structured_response")
        if not isinstance(structured, AgentAnswer):
            raise RuntimeError("Agent không trả structured_response hợp lệ.")
    except GraphRecursionError:
        # Một số model tương thích OpenAI tiếp tục gọi tool dù đã đủ dữ liệu.
        # Chốt câu trả lời bằng một lượt structured output trên bằng chứng đã lấy
        # để request không thất bại chỉ vì vòng điều phối của agent.
        evidence_refs = list(evidence_registry)
        if not evidence_refs:
            return {
                "answer": "Không tìm thấy đủ bằng chứng trong slide để trả lời câu hỏi này.",
                "sources": [],
                "model": settings.chat_model,
            }
        grounded, _ = await answer_with_context(
            question,
            [evidence_registry[ref] for ref in evidence_refs],
        )
        structured = AgentAnswer(
            answer=grounded.answer,
            source_refs=[
                evidence_refs[source_id - 1]
                for source_id in grounded.source_ids
                if 1 <= source_id <= len(evidence_refs)
            ],
        )

    sources = []
    seen = set()
    for ref in structured.source_refs:
        source = source_registry.get(ref)
        if source and ref not in seen:
            sources.append(source)
            seen.add(ref)
    return {"answer": structured.answer, "sources": sources, "model": settings.chat_model}
