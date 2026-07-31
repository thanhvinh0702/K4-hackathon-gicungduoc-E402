# VLearn

MVP học với slide PDF: tải bài học lên filesystem, xem PDF, tìm các đoạn liên quan bằng embedding và hỏi đáp bằng RAG.

## Chạy ứng dụng

Yêu cầu Python 3.11+ và Poppler (`pdfinfo`, `pdftotext`). Trên Ubuntu/Debian:

```bash
sudo apt-get install poppler-utils
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Điền `OPENAI_API_KEY` trong `.env`. Nếu dùng proxy hoặc API tương thích OpenAI, điền thêm base URL (bao gồm `/v1` nếu nhà cung cấp yêu cầu):

```dotenv
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://api.example.com/v1
```

Để trống `OPENAI_BASE_URL` nếu muốn dùng endpoint mặc định của OpenAI. Sau đó chạy:

```bash
.venv/bin/python run.py
```

Mở `http://localhost:3000`. Có thể đổi cổng bằng biến môi trường `PORT`.

## Dữ liệu

- PDF và metadata: `uploads/` và `uploads/lessons.json`
- Text/chunks đã trích xuất: `uploads/extracted/`
- Vector embeddings: `uploads/embeddings/`

Không dùng database. Các file JSON được ghi atomically để tránh metadata bị ghi dở. PDF tối đa 50 MB.

Để xử lý lại toàn bộ PDF có sẵn:

```bash
.venv/bin/python scripts/process_existing.py
```

Hoặc chỉ một bài:

```bash
.venv/bin/python scripts/process_existing.py --lesson-id LESSON_ID
```

## API chính

- `GET /api/health`
- `GET /api/lessons`
- `POST /api/lessons` — multipart gồm `pdf` và `title` tùy chọn
- `GET /api/lessons/{lesson_id}/status`
- `POST /api/lessons/{lesson_id}/reprocess`
- `POST /api/lessons/{lesson_id}/chat` — hỏi trong một bài học
- `POST /api/chat` — hỏi trên toàn bộ thư viện

Chat trả về `answer` cùng `sources`; mỗi source chứa `lessonId`, `page`, `label` và điểm tương đồng để frontend mở đúng PDF/trang.

Phần trả lời dùng LangChain structured output với function calling. Với model có tiền tố `openrouter/`, backend tự tắt reasoning/thinking để gateway có thể ép model gọi tool trả schema `GroundedAnswer`.

## Kiểm thử

```bash
.venv/bin/python -m pytest -q
```
