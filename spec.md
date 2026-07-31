# 📋 Product Specification (spec.md) - VLearn

> **Venture Arena 02 Hackathon Project**

---

## 1. Bài toán (Problem Statement)

Học viên và giảng viên khi học tập qua slide PDF thường gặp khó khăn trong việc:

- Tìm kiếm và trích xuất nhanh thông tin quan trọng trong slide dài.
- Giải đáp ngay lập tức các thắc mắc phát sinh mà không cần ngắt quãng buổi học.
- Đánh giá mức độ hiểu bài và ôn tập kiến thức cốt lõi.

---

## 2. Bằng chứng (Evidence)

- Theo khảo sát nhanh học viên: **78%** học viên dành quá 15 phút để tìm lại một khái niệm trong bộ slide bài giảng 50 trang.
- Giảng viên/Labcoach mất nhiều thời gian lặp đi lặp lại việc trả lời các câu hỏi cơ bản từ nhiều học viên khác nhau.

---

## 3. Lát cắt sản phẩm (Proof Slice / Core Scope)

Ứng dụng **VLearn** tập trung vào đúng **MỘT việc nhỏ nhất đủ để chứng minh ý tưởng**:

- **Trình xem Slide PDF tương tác:** Tải lên và hiển thị trực quan slide PDF trong trình duyệt.
- **Trợ lý VLearn AI Chat (AI Chạy Thật):** Tích hợp AI hỗ trợ trả lời câu hỏi trực tiếp theo ngữ cảnh bài học, xử lý linh hoạt mọi câu gõ lạ từ người dùng/Labcoach.

---

## 4. Quality Bar & Eval Criteria

- **Tính khả thi của AI:** Có ít nhất 1 lời gọi AI chạy thật (Google Gemini API).
- **Bộ Test & Benchmark:** Đạt 100% tỷ lệ đỗ trên bộ Golden Set **20 câu thử nghiệm** (`eval/golden_set.json`).
- **Độ trễ (Latency):** Thời gian phản hồi AI trung bình `< 2000 ms`.
- **Trải nghiệm người dùng:** Giao diện trực quan, không giật lag, fallback an toàn khi gặp lỗi mạng.
