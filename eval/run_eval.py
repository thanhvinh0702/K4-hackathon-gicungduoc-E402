import asyncio
import argparse
import json
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import settings
from backend.services.agent_service import run_rag_agent
from backend.storage import extracted_path, read_json, read_lessons


EVAL_DIR = Path(__file__).resolve().parent
GOLDEN_SET_PATH = EVAL_DIR / "golden_set.json"
RESULTS_PATH = EVAL_DIR / "results_v1.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def write_atomic(value: dict) -> None:
    temporary = RESULTS_PATH.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(RESULTS_PATH)


def lesson_aliases() -> dict[str, dict]:
    aliases = {}
    for lesson in read_lessons():
        document = read_json(extracted_path(lesson["id"]), {}) or {}
        sample = " ".join(page.get("text", "") for page in document.get("pages", [])[:8]).lower()
        raw_name = f"{lesson.get('title', '')} {lesson.get('originalName', '')}".lower()
        if "ai, ml" in sample or "llm" in sample or "d1-slide" in raw_name:
            canonical_id = "ai-llm-foundation"
            canonical_title = "AI & LLM Foundation"
        elif "spotbugs" in sample or "spotbugs" in raw_name:
            canonical_id = "spotbugs-analysis"
            canonical_title = "Kiểm thử với SpotBugs"
        else:
            canonical_id = lesson["id"]
            canonical_title = lesson["title"]
        aliases[lesson["id"]] = {"id": canonical_id, "title": canonical_title}
    return aliases


def summarize(details: list[dict], status: str) -> dict:
    total = len(details)
    passed = sum(item["passed"] for item in details)
    slide_matches = sum(item["slide_matched"] for item in details)
    page_hits = sum(item["page_hit"] for item in details)
    errors = sum(bool(item.get("error")) for item in details)
    categories = defaultdict(lambda: {"total": 0, "passed": 0})
    for item in details:
        category = categories[item["category"]]
        category["total"] += 1
        category["passed"] += int(item["passed"])
    return {
        "evaluated_at": utc_now(),
        "status": status,
        "engine": "VLearn LangChain Agentic RAG",
        "model": settings.chat_model,
        "embedding_model": settings.embedding_model,
        "summary": {
            "total_queries": total,
            "overall_passed": passed,
            "pass_rate_percent": round(passed * 100 / total, 1) if total else 0,
            "slide_document_accuracy_percent": round(slide_matches * 100 / total, 1) if total else 0,
            "page_citation_accuracy_percent": round(page_hits * 100 / total, 1) if total else 0,
            "avg_latency_ms": round(sum(item["latency_ms"] for item in details) / total) if total else 0,
            "errors": errors,
        },
        "category_breakdown": dict(categories),
        "details": details,
    }


async def evaluate_case(case: dict, aliases: dict[str, dict]) -> dict:
    started = time.perf_counter()
    error = None
    try:
        response = await run_rag_agent(case["query"])
    except Exception as exc:
        response = {"answer": "", "sources": [], "model": settings.chat_model}
        error = f"{type(exc).__name__}: {exc}"
    latency_ms = round((time.perf_counter() - started) * 1000)

    sources = response.get("sources", [])
    retrieved_pages = list(dict.fromkeys(source["page"] for source in sources))
    retrieved_documents = []
    for source in sources:
        alias = aliases.get(source["lessonId"], {"id": source["lessonId"], "title": source["lessonId"]})
        if alias not in retrieved_documents:
            retrieved_documents.append(alias)
    retrieved_slide_ids = [item["id"] for item in retrieved_documents]
    retrieved_slide = " / ".join(item["title"] for item in retrieved_documents) or "Không có"

    expected_pages = case.get("expected_pages", [])
    expected_slide_id = case.get("expected_slide_id", "")
    slide_matched = not retrieved_documents if expected_slide_id == "none" else expected_slide_id in retrieved_slide_ids
    page_hit = not retrieved_pages if not expected_pages else all(page in retrieved_pages for page in expected_pages)
    passed = bool(slide_matched and page_hit and not error)
    reason = (
        f"Slide: \"{retrieved_slide}\", Trang: {retrieved_pages} (Chính xác)"
        if passed
        else f"Kỳ vọng \"{case.get('expected_slide_title')}\" trang {expected_pages}; nhận \"{retrieved_slide}\" trang {retrieved_pages}."
    )
    return {
        "id": case["id"],
        "category": case["category"],
        "query": case["query"],
        "expected_slide": case.get("expected_slide_title"),
        "retrieved_slide": retrieved_slide,
        "retrieved_slide_ids": retrieved_slide_ids,
        "expected_pages": expected_pages,
        "retrieved_pages": retrieved_pages,
        "slide_matched": slide_matched,
        "page_hit": page_hit,
        "difficulty": case.get("difficulty"),
        "response": response.get("answer", ""),
        "sources": sources,
        "provider": response.get("model", settings.chat_model),
        "latency_ms": latency_ms,
        "passed": passed,
        "reason": reason,
        "error": error,
    }


async def main(errors_only: bool = False) -> None:
    golden_set = json.loads(GOLDEN_SET_PATH.read_text(encoding="utf-8"))
    aliases = lesson_aliases()
    details_by_id: dict[str, dict] = {}
    selected_cases = golden_set

    if errors_only:
        if not RESULTS_PATH.exists():
            raise SystemExit("Không có results_v1.json để tìm các case lỗi.")
        previous = json.loads(RESULTS_PATH.read_text(encoding="utf-8"))
        previous_details = previous.get("details", [])
        details_by_id = {item["id"]: item for item in previous_details}
        error_ids = {
            item["id"]
            for item in previous_details
            if item.get("error") is not None
        }
        selected_cases = [case for case in golden_set if case["id"] in error_ids]
        if not selected_cases:
            print("Không có case nào có error != null. Không thay đổi results_v1.json.")
            return

    for index, case in enumerate(selected_cases, start=1):
        result = await evaluate_case(case, aliases)
        details_by_id[result["id"]] = result
        ordered_details = [details_by_id[item["id"]] for item in golden_set if item["id"] in details_by_id]
        write_atomic(summarize(ordered_details, status="running"))
        marker = "HIT" if result["passed"] else "MISS"
        print(
            f"[{index:02d}/{len(selected_cases)}] {marker} {result['id']} "
            f"pages={result['retrieved_pages']} latency={result['latency_ms']}ms",
            flush=True,
        )
    ordered_details = [details_by_id[item["id"]] for item in golden_set if item["id"] in details_by_id]
    status = "completed" if len(ordered_details) == len(golden_set) else "partial"
    write_atomic(summarize(ordered_details, status=status))
    print(f"Saved: {RESULTS_PATH}", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chạy VLearn Agentic RAG golden-set evaluation.")
    parser.add_argument(
        "--errors-only",
        action="store_true",
        help="Chỉ chạy lại các case trong results_v1.json có error != null rồi merge theo id.",
    )
    arguments = parser.parse_args()
    asyncio.run(main(errors_only=arguments.errors_only))
