import asyncio
from collections.abc import Awaitable, Callable
from typing import TypeVar

from openai import AsyncOpenAI
from langchain_openai import ChatOpenAI

from backend.config import settings
from backend.models import GroundedAnswer


T = TypeVar("T")
_client: AsyncOpenAI | None = None
_chat_model: ChatOpenAI | None = None


class AIConfigurationError(RuntimeError):
    pass


def has_api_key() -> bool:
    return bool(settings.openai_api_key)


def get_client() -> AsyncOpenAI:
    global _client
    if not has_api_key():
        raise AIConfigurationError("OPENAI_API_KEY chưa được cấu hình trên backend.")
    if _client is None:
        client_options = {
            "api_key": settings.openai_api_key,
            "timeout": 45.0,
            "max_retries": 0,
        }
        if settings.openai_base_url:
            client_options["base_url"] = settings.openai_base_url
        _client = AsyncOpenAI(**client_options)
    return _client


def get_chat_model() -> ChatOpenAI:
    global _chat_model
    if not has_api_key():
        raise AIConfigurationError("OPENAI_API_KEY chưa được cấu hình trên backend.")
    if _chat_model is None:
        options = {
            "model": settings.chat_model,
            "api_key": settings.openai_api_key,
            "timeout": 45.0,
            "max_retries": 0,
            "max_completion_tokens": 1200,
        }
        if settings.openai_base_url:
            options["base_url"] = settings.openai_base_url
        if settings.chat_model.startswith("openrouter/"):
            # Some OpenRouter providers reject forced tool_choice while thinking mode is on.
            options["extra_body"] = {"reasoning": {"enabled": False}}
        elif settings.chat_model.startswith("gpt-5.6"):
            # GPT-5.6 Chat Completions function tools require effective reasoning none.
            options["reasoning_effort"] = "none"
        _chat_model = ChatOpenAI(**options)
    return _chat_model


async def _with_retry(operation: Callable[[], Awaitable[T]], attempts: int = 3) -> T:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            return await operation()
        except Exception as error:
            last_error = error
            if attempt + 1 < attempts:
                await asyncio.sleep(0.6 * (2**attempt))
    assert last_error is not None
    raise last_error


async def create_embeddings(texts: list[str], model: str | None = None) -> list[list[float]]:
    if not texts:
        return []
    client = get_client()
    embedding_model = model or settings.embedding_model

    async def request():
        return await client.embeddings.create(
            model=embedding_model,
            input=texts,
            encoding_format="float",
        )

    response = await _with_retry(request)
    ordered = sorted(response.data, key=lambda item: item.index)
    return [item.embedding for item in ordered]


async def answer_with_context(question: str, sources: list[dict]) -> tuple[GroundedAnswer, str]:
    model = get_chat_model()
    context_blocks = []
    for index, source in enumerate(sources, start=1):
        page_range = str(source["pageStart"])
        if source["pageEnd"] != source["pageStart"]:
            page_range += f"-{source['pageEnd']}"
        context_blocks.append(
            f"[Nguồn {index}] Bài: {source['lessonTitle']} | Trang {page_range}"
            f" | {source['title']}\n{source['text']}"
        )
    context = "\n\n".join(context_blocks)
    instructions = (
        "Bạn là trợ lý học tập của VLearn. Chỉ trả lời dựa trên phần NGUỒN được cung cấp. "
        "Trả lời bằng tiếng Việt, rõ ràng và súc tích. Chọn source_ids từ số nguồn được cung cấp; "
        "không tự tạo ID hoặc số trang. Nếu nguồn không đủ, nói rõ trong answer và trả source_ids rỗng."
    )
    user_input = f"CÂU HỎI:\n{question}\n\nNGUỒN:\n{context}"

    structured_model = model.with_structured_output(
        GroundedAnswer,
        method="function_calling",
        include_raw=True,
    )

    async def request():
        return await structured_model.ainvoke(
            [("system", instructions), ("human", user_input)],
        )

    result = await _with_retry(request)
    parsed = result.get("parsed") if isinstance(result, dict) else None
    parsing_error = result.get("parsing_error") if isinstance(result, dict) else None
    if parsing_error:
        raise RuntimeError(f"Model trả structured output không hợp lệ: {parsing_error}")
    if not isinstance(parsed, GroundedAnswer):
        raise RuntimeError("Model không gọi tool GroundedAnswer hoặc không trả dữ liệu có cấu trúc.")
    return parsed, settings.chat_model
