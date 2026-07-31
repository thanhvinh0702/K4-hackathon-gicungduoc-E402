import asyncio
import json
import logging
import time
import uuid
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

from openai import AsyncOpenAI
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, ValidationError

from backend.config import settings
from backend.models import GroundedAnswer, RouteDecision
from backend.prompts import (
    GROUNDED_SYSTEM_PROMPT,
    GROUNDED_USER_PROMPT_TEMPLATE,
    ROUTER_SYSTEM_PROMPT,
    ROUTER_USER_PROMPT_TEMPLATE,
)


T = TypeVar("T")
_client: AsyncOpenAI | None = None
_chat_model: ChatOpenAI | None = None
_router_model: ChatOpenAI | None = None
logger = logging.getLogger("uvicorn.error")


class AIConfigurationError(RuntimeError):
    pass


def _json_from_text(value: Any) -> dict | None:
    """Extract one JSON object from provider-specific text content."""
    if isinstance(value, dict):
        return value
    if isinstance(value, list):
        value = "".join(
            str(block.get("text", ""))
            for block in value
            if isinstance(block, dict) and block.get("type") == "text"
        )
    if not isinstance(value, str):
        return None
    start = value.find("{")
    end = value.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        parsed = json.loads(value[start : end + 1])
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _parse_structured_result(
    result: Any,
    schema: type[BaseModel],
    error_prefix: str,
) -> BaseModel:
    """Normalize structured output returned by OpenAI-compatible gateways.

    Some gateways return a plain dict, normalized tool arguments, raw OpenAI tool
    calls, or JSON text even when LangChain's ``parsed`` field is empty.
    """
    parsed = result.get("parsed") if isinstance(result, dict) else None
    parsing_error = result.get("parsing_error") if isinstance(result, dict) else None
    candidates: list[Any] = [parsed]
    raw = result.get("raw") if isinstance(result, dict) else result

    if raw is not None:
        for tool_call in getattr(raw, "tool_calls", None) or []:
            if isinstance(tool_call, dict):
                candidates.append(tool_call.get("args"))

        additional_kwargs = getattr(raw, "additional_kwargs", None) or {}
        for tool_call in additional_kwargs.get("tool_calls", []):
            if not isinstance(tool_call, dict):
                continue
            function = tool_call.get("function", {})
            if isinstance(function, dict):
                candidates.append(function.get("arguments"))

        candidates.append(getattr(raw, "content", None))

    validation_error: Exception | None = None
    for candidate in candidates:
        if isinstance(candidate, schema):
            return candidate
        payload = candidate if isinstance(candidate, dict) else _json_from_text(candidate)
        if payload is None:
            continue
        try:
            return schema.model_validate(payload)
        except ValidationError as error:
            validation_error = error

    detail = parsing_error or validation_error
    if detail:
        raise RuntimeError(f"{error_prefix} trả structured output không hợp lệ: {detail}")
    raise RuntimeError(f"{error_prefix} không trả {schema.__name__} hợp lệ.")


def _structured_result_debug(result: Any) -> dict:
    """Return safe, compact metadata for diagnosing gateway structured output."""
    result_dict = result if isinstance(result, dict) else {}
    raw = result_dict.get("raw", result)
    parsed = result_dict.get("parsed")
    parsing_error = result_dict.get("parsing_error")
    normalized_tools = []
    for tool_call in getattr(raw, "tool_calls", None) or []:
        if isinstance(tool_call, dict):
            normalized_tools.append(tool_call.get("name") or "unnamed")

    additional_kwargs = getattr(raw, "additional_kwargs", None) or {}
    provider_tools = []
    for tool_call in additional_kwargs.get("tool_calls", []):
        if not isinstance(tool_call, dict):
            continue
        function = tool_call.get("function", {})
        provider_tools.append(function.get("name") if isinstance(function, dict) else "unnamed")

    metadata = getattr(raw, "response_metadata", None) or {}
    safe_metadata = {
        key: metadata.get(key)
        for key in ("model_name", "model", "finish_reason", "system_fingerprint")
        if metadata.get(key) is not None
    }
    usage = getattr(raw, "usage_metadata", None)
    content = getattr(raw, "content", None)
    content_preview = repr(content)
    if len(content_preview) > 800:
        content_preview = content_preview[:800] + "..."

    return {
        "result_type": type(result).__name__,
        "result_keys": sorted(result_dict.keys()),
        "raw_type": type(raw).__name__ if raw is not None else None,
        "parsed_type": type(parsed).__name__ if parsed is not None else None,
        "parsing_error": repr(parsing_error) if parsing_error else None,
        "normalized_tool_calls": normalized_tools,
        "provider_tool_calls": provider_tools,
        "content_preview": content_preview,
        "response_metadata": safe_metadata,
        "usage_metadata": usage,
    }


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


def _chat_model_options(model: str, max_completion_tokens: int) -> dict:
    options = {
        "model": model,
        "api_key": settings.openai_api_key,
        "timeout": 45.0,
        "max_retries": 0,
        "max_completion_tokens": max_completion_tokens,
    }
    if settings.openai_base_url:
        options["base_url"] = settings.openai_base_url
    if model.startswith("openrouter/"):
        # Some OpenRouter providers reject forced tool_choice while thinking mode is on.
        options["extra_body"] = {"reasoning": {"enabled": False}}
    elif model.startswith("gpt-5.6"):
        # GPT-5.6 Chat Completions function tools require effective reasoning none.
        options["reasoning_effort"] = "none"
    return options


def get_chat_model() -> ChatOpenAI:
    global _chat_model
    if not has_api_key():
        raise AIConfigurationError("OPENAI_API_KEY chưa được cấu hình trên backend.")
    if _chat_model is None:
        _chat_model = ChatOpenAI(**_chat_model_options(settings.chat_model, 1200))
    return _chat_model


def get_router_model() -> ChatOpenAI:
    global _router_model
    if not has_api_key():
        raise AIConfigurationError("OPENAI_API_KEY chưa được cấu hình trên backend.")
    if _router_model is None:
        _router_model = ChatOpenAI(**_chat_model_options(settings.router_model, 320))
    return _router_model


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
    user_input = GROUNDED_USER_PROMPT_TEMPLATE.format(question=question, context=context)

    structured_model = model.with_structured_output(
        GroundedAnswer,
        method="function_calling",
        include_raw=True,
    )

    async def request():
        return await structured_model.ainvoke(
            [("system", GROUNDED_SYSTEM_PROMPT), ("human", user_input)],
        )

    result = await _with_retry(request)
    parsed = _parse_structured_result(result, GroundedAnswer, "Model")
    return parsed, settings.chat_model


async def route_question(
    question: str,
    sources: list[dict],
    scope: str,
) -> tuple[RouteDecision, str]:
    request_id = uuid.uuid4().hex[:8]
    started = time.perf_counter()
    candidates = [
        {
            "source_id": index,
            "lesson": source.get("lessonTitle"),
            "page": source.get("pageStart"),
            "title": source.get("title"),
            "score": round(float(source.get("score", 0.0)), 4),
            "excerpt": str(source.get("text", ""))[:700],
        }
        for index, source in enumerate(sources, start=1)
    ]
    user_input = ROUTER_USER_PROMPT_TEMPLATE.format(
        scope=scope,
        question=question,
        candidates=json.dumps(candidates, ensure_ascii=False),
    )
    logger.info(
        "[router:%s] prepare model=%s base_url=%s candidates=%d question_chars=%d",
        request_id,
        settings.router_model,
        settings.openai_base_url or "OpenAI default",
        len(candidates),
        len(question),
    )
    try:
        structured_model = get_router_model().with_structured_output(
            RouteDecision,
            method="function_calling",
            include_raw=True,
        )
    except Exception:
        logger.exception("[router:%s] failed before HTTP dispatch", request_id)
        raise

    attempt = 0
    async def request():
        nonlocal attempt
        attempt += 1
        logger.info(
            "[router:%s] HTTP dispatch attempt=%d model=%s",
            request_id,
            attempt,
            settings.router_model,
        )
        return await structured_model.ainvoke(
            [("system", ROUTER_SYSTEM_PROMPT), ("human", user_input)],
        )

    try:
        result = await _with_retry(request, attempts=2)
    except Exception:
        logger.exception(
            "[router:%s] HTTP request failed attempts=%d elapsed_ms=%d",
            request_id,
            attempt,
            round((time.perf_counter() - started) * 1000),
        )
        raise

    debug = _structured_result_debug(result)
    logger.info(
        "[router:%s] HTTP response elapsed_ms=%d payload=%s",
        request_id,
        round((time.perf_counter() - started) * 1000),
        json.dumps(debug, ensure_ascii=False, default=str),
    )
    try:
        parsed = _parse_structured_result(result, RouteDecision, "Router")
    except Exception:
        logger.exception(
            "[router:%s] parse failed payload=%s",
            request_id,
            json.dumps(debug, ensure_ascii=False, default=str),
        )
        raise
    logger.info(
        "[router:%s] decision route=%s elapsed_ms=%d",
        request_id,
        parsed.route,
        round((time.perf_counter() - started) * 1000),
    )
    return parsed, settings.router_model
