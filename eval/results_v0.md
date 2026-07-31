# Bảng kết quả V0 — VLearn Agentic RAG

> Nguồn dữ liệu: `eval/results_v1.json`

## Thông tin lượt đánh giá

| Thuộc tính | Giá trị |
|---|---|
| Thời gian | `2026-07-31T03:34:43.181818Z` |
| Trạng thái | `completed` |
| Engine | VLearn LangChain Agentic RAG |
| Chat model | `openrouter/deepseek/deepseek-v4-flash` |
| Embedding model | `openrouter/openai/text-embedding-3-large` |

## Tổng quan

| Chỉ số | Kết quả |
|---|---:|
| Tổng số câu hỏi | 20 |
| Số câu đạt | 8 |
| Pass rate | 40.0% |
| Độ chính xác tài liệu | 80.0% |
| Độ chính xác trang trích dẫn | 50.0% |
| Độ trễ trung bình | 18,567 ms |
| Số lỗi thực thi | 6 |

## Kết quả theo nhóm

| Nhóm | Tổng | Đạt | Tỉ lệ |
|---|---:|---:|---:|
| AI & LLM Foundation | 7 | 3 | 42.9% |
| SpotBugs Static Analysis | 6 | 4 | 66.7% |
| Cross-Topic Inference | 3 | 0 | 0.0% |
| Edge Cases (Out of Scope) | 2 | 0 | 0.0% |
| Adversarial Wildcard | 2 | 1 | 50.0% |

## Chi tiết từng test case

| ID | Nhóm | Độ khó | Trang kỳ vọng | Trang nhận được | Slide | Page | Kết quả | Lỗi |
|---|---|---|---:|---:|:---:|:---:|:---:|---|
| `RET-01` | AI & LLM Foundation | Easy | 3 | 3 | ✅ | ✅ | ✅ PASS | — |
| `RET-02` | AI & LLM Foundation | Easy | 5 | 5, 6, 9 | ✅ | ✅ | ✅ PASS | — |
| `RET-03` | AI & LLM Foundation | Medium | 10 | 13, 14, 15, 16 | ✅ | ❌ | ❌ FAIL | — |
| `RET-04` | AI & LLM Foundation | Easy | 23 | 24 | ✅ | ❌ | ❌ FAIL | — |
| `RET-05` | AI & LLM Foundation | Medium | 25 | 26, 27 | ✅ | ❌ | ❌ FAIL | — |
| `RET-06` | AI & LLM Foundation | Easy | 28 | 29, 28, 22 | ✅ | ✅ | ✅ PASS | — |
| `RET-07` | AI & LLM Foundation | Hard | 20 | — | ❌ | ❌ | ❌ FAIL | GraphRecursionError: Recursion limit of 10 reached without hitting a stop condition. You can increase the limit by setting the `recursion… |
| `RET-08` | SpotBugs Static Analysis | Easy | 6 | 6, 7, 14, 3 | ✅ | ✅ | ✅ PASS | — |
| `RET-09` | SpotBugs Static Analysis | Medium | 10 | 10, 11, 12, 13, 14 | ✅ | ✅ | ✅ PASS | — |
| `RET-10` | SpotBugs Static Analysis | Medium | 15 | 17, 18, 15, 14 | ✅ | ✅ | ✅ PASS | — |
| `RET-11` | SpotBugs Static Analysis | Medium | 22 | 26, 23 | ✅ | ❌ | ❌ FAIL | — |
| `RET-12` | SpotBugs Static Analysis | Easy | 27 | 32, 26 | ✅ | ❌ | ❌ FAIL | — |
| `RET-13` | SpotBugs Static Analysis | Easy | 38 | 38, 39, 23 | ✅ | ✅ | ✅ PASS | — |
| `RET-14` | Cross-Topic Inference | Hard | 23, 15 | — | ❌ | ❌ | ❌ FAIL | InternalServerError: Error code: 502 - {'error': {'message': '[openrouter/openai/text-embedding-3-large] [502]: fetch failed (cause: UND_… |
| `RET-15` | Cross-Topic Inference | Hard | 10 | — | ❌ | ❌ | ❌ FAIL | InternalServerError: Error code: 502 - {'error': {'message': '[openrouter/openai/text-embedding-3-large] [502]: fetch failed (cause: UND_… |
| `RET-16` | Cross-Topic Inference | Hard | 25, 38 | — | ❌ | ❌ | ❌ FAIL | InternalServerError: Error code: 502 - {'error': {'message': '[openrouter/openai/text-embedding-3-large] [502]: fetch failed (cause: UND_… |
| `RET-17` | Edge Cases (Out of Scope) | Easy | — | — | ✅ | ✅ | ❌ FAIL | InternalServerError: Error code: 502 - {'error': {'message': '[openrouter/openai/text-embedding-3-large] [502]: fetch failed (cause: UND_… |
| `RET-18` | Edge Cases (Out of Scope) | Easy | — | — | ✅ | ✅ | ❌ FAIL | GraphRecursionError: Recursion limit of 10 reached without hitting a stop condition. You can increase the limit by setting the `recursion… |
| `RET-19` | Adversarial Wildcard | Hard | 10 | 15, 16, 20 | ✅ | ❌ | ❌ FAIL | — |
| `RET-20` | Adversarial Wildcard | Hard | 23 | 24, 23 | ✅ | ✅ | ✅ PASS | — |

## Các case có lỗi thực thi

- `RET-07`: GraphRecursionError: Recursion limit of 10 reached without hitting a stop condition. You can increase the limit by setting the `recursion_limit` config key. For troubleshooting, visit: https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT
- `RET-14`: InternalServerError: Error code: 502 - {'error': {'message': '[openrouter/openai/text-embedding-3-large] [502]: fetch failed (cause: UND_ERR_CONNECT_TIMEOUT: Connect Timeout Error (attempted address: openr (reset after 18s)'}}
- `RET-15`: InternalServerError: Error code: 502 - {'error': {'message': '[openrouter/openai/text-embedding-3-large] [502]: fetch failed (cause: UND_ERR_CONNECT_TIMEOUT: Connect Timeout Error (attempted address: openr (reset after 12s)'}}
- `RET-16`: InternalServerError: Error code: 502 - {'error': {'message': '[openrouter/openai/text-embedding-3-large] [502]: fetch failed (cause: UND_ERR_CONNECT_TIMEOUT: Connect Timeout Error (attempted address: openr (reset after 6s)'}}
- `RET-17`: InternalServerError: Error code: 502 - {'error': {'message': '[openrouter/openai/text-embedding-3-large] [502]: fetch failed (cause: UND_ERR_CONNECT_TIMEOUT: Connect Timeout Error (attempted address: openr (reset after 1s)'}}
- `RET-18`: GraphRecursionError: Recursion limit of 10 reached without hitting a stop condition. You can increase the limit by setting the `recursion_limit` config key. For troubleshooting, visit: https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT

