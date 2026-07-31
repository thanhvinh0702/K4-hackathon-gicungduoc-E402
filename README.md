# 🎓 VLearn - AI Slide Learning Assistant (Multi-Slide RAG Agent)

Ứng dụng web xem slide PDF bài giảng kết hợp Trợ lý Học tập AI (VLearn AI) chạy thật, hỗ trợ học viên đặt câu hỏi và tương tác trực tiếp với kho tài liệu slide rời rạc bằng cơ chế RAG (Retrieval-Augmented Generation).

> **Sản phẩm thuộc Hackathon Venture Arena 02 (1.5 Ngày)**

---

## 👥 Thành viên nhóm & Phân công nhiệm vụ (Deliverable #01)

| Họ và tên | Mã học viên | Phân công nhiệm vụ (Role & Ownership) |
| :--- | :--- | :--- |
| **Trần Minh Hiền** | `HV-0402` | **Leader & Fullstack Developer**: Phát triển backend (`server.js` / Python FastAPI), tích hợp AI Gemini API, dựng UI/UX web. |
| **Thành viên 02** | `HV-0403` | **AI & Eval Specialist**: Xây dựng bộ dữ liệu Golden Set 20+ test cases (`eval/`), viết script benchmark `run_eval.js`. |
| **Thành viên 03** | `HV-0404` | **Product & User Testing**: Xây dựng `spec.md`, thu thập feedback validation từ người dùng thật. |

---

## 🚀 Hướng dẫn chạy ứng dụng

### Cách 1: Node.js (Quickstart)
Yêu cầu **Node.js 18** trở lên.

```bash
# 1. Cài đặt thư viện
npm install

# 2. Cấu hình API Key (Gemini hoặc OpenAI)
export GEMINI_API_KEY="your-gemini-api-key"

# 3. Khởi chạy ứng dụng Web
npm start
```
Mở trình duyệt: `http://localhost:3000`

---

### Cách 2: Python Backend (RAG Engine với Poppler & Embeddings)
Yêu cầu **Python 3.11+** và Poppler:

```bash
# Cài đặt môi trường Python
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env

# Điền OPENAI_API_KEY hoặc GEMINI_API_KEY trong .env
.venv/bin/python run.py
```
Mở trình duyệt: `http://localhost:3000`

---

## 📊 Hướng dẫn Chạy Benchmark Evaluation (Nặng 15 điểm)

Bộ test `eval/` bao gồm 20 kịch bản thử nghiệm Retrieval (Định vị đúng Bộ Slide rời rạc & Số trang PDF Ground Truth).

```bash
# Chạy script tự động kiểm thử 20 Retrieval test cases
node eval/run_eval.js
```

Kết quả xuất ra:
- `eval/results_v1.json`: Chi tiết dữ liệu log từng câu test.
- `eval/README.md`: Báo cáo bảng tổng hợp chỉ số (Slide Acc %, Page Citation Acc %, Latency ms).

---

## 📁 Cấu trúc Thư mục Hackathon

- `README.md`: Thành viên, phân công & hướng dẫn chạy.
- `spec.md`: Bài toán, bằng chứng, lát cắt sản phẩm, quality bar.
- `server.js` & `backend/`: Server Express & Python FastAPI RAG Endpoint (`POST /api/chat`).
- `public/`: Giao diện Web tương tác PDF & Khung Chat AI Assistant.
- `eval/`: Golden set (20 cases), `run_eval.js`, log kết quả & báo cáo benchmark.
- `uploads/`: Thư mục chứa slide PDF bài giảng & vector embeddings.
