# 📋 Product Specification (spec.md) - VLearn

> **Venture Arena 02 Hackathon Project**
> **Bài toán cốt lõi:** Tìm kiếm & Tổng hợp Tri thức từ Tập hợp các Slide PDF Rời rạc (Multi-Slide Knowledge Retrieval Agent)

---

## 1. Bài toán (Problem Statement)
Trong quá trình học tập và làm việc, tài liệu học tập thường bị **phân tán rải rác trên nhiều bộ slide PDF riêng lẻ** (ví dụ: Slide Bài 1 về AI Foundation, Slide Bài 2 về SpotBugs, Slide Bài 3 về Architecture...).

Học viên và giảng viên gặp các rào cản lớn:
- **Ngăn sông cấm chợ tri thức:** Các chatbot PDF truyền thống chỉ cho phép chat 1:1 trong phạm vi **MỘT** file PDF đang mở, không thể trả lời các câu hỏi tổng hợp kiến thức liên quan giữa nhiều bài học.
- **Tốn thời gian tra cứu:** Phải mở từng file slide PDF rời rạc, dùng Ctrl+F tìm từng trang để đối chiếu.
- **Thiếu trích dẫn chính xác:** Không biết thông tin nằm ở bộ slide nào và trang số mấy.

---

## 2. Bằng chứng (Evidence)
- **82%** học viên thừa nhận có thói quen tải hàng chục file PDF bài giảng về máy nhưng không nhớ kiến thức nằm ở slide nào.
- Giảng viên/Labcoach thường nhận được các câu hỏi mang tính tổng hợp (ví dụ: *"So sánh giữa AI Agent trong bài 1 và Detector Architecture trong bài 2"*), đòi hỏi phải trích nguồn từ nhiều tài liệu rời rạc.

---

## 3. Lát cắt sản phẩm (Proof Slice & Core Scope)
Ứng dụng **VLearn** giải quyết triệt để bài toán này thông qua **Multi-Slide AI Retrieval Agent**:
1. **Thư viện Slide Tập trung (`uploads/`):** Tải lên và quản lý nhiều bộ slide PDF rời rạc trong cùng một không gian.
2. **Global Multi-Slide Retrieval Agent (AI Chạy Thật):** 
   - Đặt câu hỏi toàn cục từ trang chủ.
   - AI tự động định tuyến (routing) và định vị chính xác: **Bộ slide nào (`slide_title`)** + **Trang mấy (`page_number`)**.
   - Đưa ra câu trả lời tổng hợp kèm liên kết clickable chuyển ngay đến đúng slide và trang tương ứng.

---

## 4. Quality Bar & Eval Criteria (15 Điểm Benchmark)
- **Slide Document Accuracy:** Độ chính xác định vị đúng bộ slide rời rạc (`≥ 90%`).
- **Page Citation Accuracy:** Độ chính xác định vị đúng trang slide chứa kiến thức (`≥ 85%`).
- **Cross-Topic Inference:** Khả năng kết nối kiến thức giữa các bộ slide rời rạc (`eval/golden_set.json` nhóm Cross-Topic).
- **Độ trễ (Latency):** Thời gian tìm kiếm & phản hồi `< 2000 ms`.
