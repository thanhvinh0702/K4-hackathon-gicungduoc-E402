# 🎓 VLearn - AI Slide Learning Assistant

Ứng dụng web xem slide PDF bài giảng kết hợp Trợ lý Học tập AI (VLearn AI) chạy thật, hỗ trợ học viên đặt câu hỏi và tương tác trực tiếp với tài liệu.

> **Sản phẩm thuộc Hackathon Venture Arena 02 (1.5 Ngày)**

---

## 👥 Thành viên nhóm & Phân công nhiệm vụ (Deliverable #01)

| Họ và tên | Mã học viên | Phân công nhiệm vụ (Role & Ownership) |
| :--- | :--- | :--- |
| **Trần Minh Hiền** | `HV-0402` | **Leader & Fullstack Developer**: Phát triển Node.js backend (`server.js`), tích hợp AI Gemini API, dựng UI/UX web. |
| **Thành viên 02** | `HV-0403` | **AI & Eval Specialist**: Xây dựng bộ dữ liệu Golden Set 20+ test cases (`eval/`), viết script benchmark `run_eval.js`. |
| **Thành viên 03** | `HV-0404` | **Product & User Testing**: Xây dựng `spec.md`, thu thập feedback validation từ người dùng thật. |

---

## 🚀 Hướng dẫn chạy ứng dụng

Yêu cầu **Node.js 18** trở lên.

```bash
# 1. Cài đặt thư viện
npm install

# 2. (Tùy chọn) Cấu hình Gemini API Key để chạy AI thật
export GEMINI_API_KEY="your-gemini-api-key"

# 3. Khởi chạy ứng dụng Web
npm start
```

Mở trình duyệt truy cập: `http://localhost:3000`

---

## 📊 Hướng dẫn Chạy Benchmark Evaluation (Nặng 15 điểm)

Bộ test `eval/` bao gồm 20 kịch bản thử nghiệm (Standard Factual, Synthesis, Out of Scope, Adversarial / Labcoach Wildcard).

```bash
# Chạy script tự động kiểm thử 20 test cases
node eval/run_eval.js
```

Kết quả sẽ được xuất tự động ra 2 tệp:
- `eval/results_v1.json`: Chi tiết dữ liệu log từng câu test.
- `eval/README.md`: Báo cáo bảng tổng hợp chỉ số (Pass Rate %, Latency ms).

---

## 📁 Cấu trúc Thư mục Hackathon

- `README.md`: Thành viên, phân công & hướng dẫn chạy.
- `spec.md`: Bài toán, bằng chứng, lát cắt sản phẩm, quality bar.
- `server.js`: Server Express & AI Chat Endpoint (`POST /api/chat`).
- `public/`: Giao diện Web tương tác PDF & Khung Chat AI Assistant.
- `eval/`: Golden set (20 cases), `run_eval.js`, log kết quả & báo cáo benchmark.
- `uploads/`: Thư mục chứa slide PDF bài giảng.
