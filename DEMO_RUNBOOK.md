# VLearn — kịch bản demo

## Chạy sản phẩm trên Windows PowerShell

```powershell
cd G:\K4-hackathon-gicungduoc-E402
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Điền `OPENAI_API_KEY` (và tùy chọn `OPENAI_BASE_URL`) trong `.env`, rồi chạy:

```powershell
python run.py
```

Mở `http://localhost:3000`.

## Mở slide

Trong một cửa sổ PowerShell khác:

```powershell
Start-Process .\demo_slides.html
```

Nhấn F11 để toàn màn hình, dùng phím mũi tên để chuyển slide.

## Kịch bản 3 phút

1. Slide 1–2 (30s): nêu vấn đề PDF rời rạc.
2. Mở app, upload 2 PDF mẫu, đặt tên rõ ràng (60s).
3. Hỏi: `Tóm tắt bài học này trong 3 ý.` (20s).
4. Hỏi: `AI Agent khác LLM ở đâu? Hãy trích nguồn.` rồi bấm citation để mở đúng trang (30s).
5. Hỏi câu so sánh giữa 2 bài học để minh họa cross-topic (30s).
6. Mở Mind map, kết bằng thông điệp “hỏi → kiểm chứng → học tiếp” (10s).

Nếu chỉ muốn chạy giao diện không cần AI, vẫn có thể mở `demo_slides.html`; để chat hoạt động cần `OPENAI_API_KEY`.
