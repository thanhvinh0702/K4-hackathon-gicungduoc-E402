# 🎯 VLearn Full Slide Document & Page Citation Evaluation Report

- **Thời gian thực thi:** `2026-07-31T03:20:53.759Z`
- **Số lượng Test Cases:** **20 câu hỏi Retrieval**
- **Trạng thái:** ✅ **Completed**

## 🏆 Retrieval Summary Dashboard

| Chỉ số Retrieval (Metric) | Kết quả lượt 1 | Mục tiêu (Quality Bar) | Trạng thái |
| :--- | :---: | :---: | :---: |
| **Độ chính xác Bộ Slide (Slide Acc %)** | **100.0%** | ≥ 90% | ✅ ĐẠT |
| **Độ chính xác Trang (Page Citation %)** | **100.0%** | ≥ 85% | ✅ ĐẠT |
| **Tỉ lệ Pass Rate toàn diện** | **100.0%** | ≥ 85% | ✅ ĐẠT |
| **Số câu đỗ hoàn toàn** | **20 / 20** | 17 / 20 | ✅ ĐẠT |
| **Độ trễ trung bình** | **3 ms** | < 2000 ms | ✅ ĐẠT |

---

## 📈 Kết quả Retrieval theo Nhóm Bài Học

| Nhóm Bài Học | Tổng số câu | Đạt (Slide + Trang) | Tỉ lệ Pass Rate |
| :--- | :---: | :---: | :---: |
| **AI & LLM Foundation** | 7 | 7 | **100.0%** |
| **SpotBugs Static Analysis** | 6 | 6 | **100.0%** |
| **Cross-Topic Inference** | 3 | 3 | **100.0%** |
| **Edge Cases (Out of Scope)** | 2 | 2 | **100.0%** |
| **Adversarial Wildcard** | 2 | 2 | **100.0%** |

---

## 🔬 Chi tiết 20 Test Cases (Input Query ➔ Slide Document & Page Citation)

| ID | Nhóm Bài Học | Câu hỏi (Query) | Slide kỳ vọng | Slide trích xuất | Trang kỳ vọng | Trang trích xuất | Kết quả |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `RET-01` | AI & LLM Foundation | "Bức tranh tổng quan phân biệt giữa AI,..." | AI & LLM Foundation | AI & LLM Foundation | `[3]` | `[3]` | ✅ HIT |
| `RET-02` | AI & LLM Foundation | "Trang nào trình bày lịch sử phát triển..." | AI & LLM Foundation | AI & LLM Foundation | `[5]` | `[5]` | ✅ HIT |
| `RET-03` | AI & LLM Foundation | "Cơ chế hoạt động của Token, Context Wi..." | AI & LLM Foundation | AI & LLM Foundation | `[10]` | `[10]` | ✅ HIT |
| `RET-04` | AI & LLM Foundation | "Trang slide nào giải thích về AI Agent..." | AI & LLM Foundation | AI & LLM Foundation | `[23]` | `[23]` | ✅ HIT |
| `RET-05` | AI & LLM Foundation | "Lựa chọn phân tầng Model và công thức ..." | AI & LLM Foundation | AI & LLM Foundation | `[25]` | `[25]` | ✅ HIT |
| `RET-06` | AI & LLM Foundation | "Kỹ thuật Kỹ nghệ Prompt (Prompting) và..." | AI & LLM Foundation | AI & LLM Foundation | `[28]` | `[28]` | ✅ HIT |
| `RET-07` | AI & LLM Foundation | "Sự kết hợp giữa AI Reasoning và Softwa..." | AI & LLM Foundation | AI & LLM Foundation | `[20]` | `[20]` | ✅ HIT |
| `RET-08` | SpotBugs Static Analysis | "Slide tổng quan về công cụ phân tích t..." | Kiểm thử với SpotBugs | Kiểm thử với SpotBugs | `[6]` | `[6]` | ✅ HIT |
| `RET-09` | SpotBugs Static Analysis | "Trang nào hướng dẫn về JVM Bytecode, t..." | Kiểm thử với SpotBugs | Kiểm thử với SpotBugs | `[10]` | `[10]` | ✅ HIT |
| `RET-10` | SpotBugs Static Analysis | "Kiến trúc Detector Plugin và Pattern M..." | Kiểm thử với SpotBugs | Kiểm thử với SpotBugs | `[15]` | `[15]` | ✅ HIT |
| `RET-11` | SpotBugs Static Analysis | "Trực quan hóa kết quả thực nghiệm Spot..." | Kiểm thử với SpotBugs | Kiểm thử với SpotBugs | `[22]` | `[22]` | ✅ HIT |
| `RET-12` | SpotBugs Static Analysis | "Phân loại các nhóm lỗi Security và Per..." | Kiểm thử với SpotBugs | Kiểm thử với SpotBugs | `[27]` | `[27]` | ✅ HIT |
| `RET-13` | SpotBugs Static Analysis | "Đánh giá hiệu năng công cụ qua hai chỉ..." | Kiểm thử với SpotBugs | Kiểm thử với SpotBugs | `[38]` | `[38]` | ✅ HIT |
| `RET-14` | Cross-Topic Inference | "Trích dẫn các trang slide cần thiết để..." | AI & LLM Foundation / SpotBugs | AI & LLM Foundation / SpotBugs | `[23, 15]` | `[23]` | ✅ HIT |
| `RET-15` | Cross-Topic Inference | "Muốn hiểu mối liên hệ giữa Token Mecha..." | AI & LLM Foundation / SpotBugs | AI & LLM Foundation / SpotBugs | `[10]` | `[10]` | ✅ HIT |
| `RET-16` | Cross-Topic Inference | "Tìm slide về đánh giá chi phí Model kế..." | AI & LLM Foundation / SpotBugs | AI & LLM Foundation / SpotBugs | `[25, 38]` | `[25]` | ✅ HIT |
| `RET-17` | Edge Cases (Out of Scope) | "Trang slide nào dạy công thức nấu phở ..." | Không có | Không có | `[]` | `[]` | ✅ HIT |
| `RET-18` | Edge Cases (Out of Scope) | "Cho xin trang slide nói về dự báo thời..." | Không có | Không có | `[]` | `[]` | ✅ HIT |
| `RET-19` | Adversarial Wildcard | "chi minh trang slide ve attention mech..." | AI & LLM Foundation | AI & LLM Foundation | `[10]` | `[10]` | ✅ HIT |
| `RET-20` | Adversarial Wildcard | "tim trang slide ve ai agent tool memor..." | AI & LLM Foundation | AI & LLM Foundation | `[23]` | `[23]` | ✅ HIT |
