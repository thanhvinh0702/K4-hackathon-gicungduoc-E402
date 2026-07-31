# 🎯 VLearn Retrieval Evaluation Report (Page Ground Truth)

- **Thời gian thực thi:** `2026-07-31T03:08:04.327Z`
- **Số lượng Test Cases:** **20 câu hỏi Retrieval**
- **Trạng thái:** ✅ **Completed**

## 🏆 Retrieval Summary Dashboard

| Chỉ số Retrieval (Metric) | Kết quả lượt 1 | Mục tiêu (Quality Bar) | Trạng thái |
| :--- | :---: | :---: | :---: |
| **Retrieval Hit Rate (%)** | **100.0%** | ≥ 85% | ✅ ĐẠT |
| **Mean Precision (%)** | **100.0%** | ≥ 80% | ✅ ĐẠT |
| **Mean Recall (%)** | **95.0%** | ≥ 80% | ✅ ĐẠT |
| **Số câu trích trang đúng** | **20 / 20** | 17 / 20 | ✅ ĐẠT |
| **Độ trễ trung bình** | **3 ms** | < 2000 ms | ✅ ĐẠT |

---

## 📈 Kết quả Retrieval theo Nhóm Tài Liệu

| Nhóm Tài Liệu / Phân Loại | Tổng số câu | Hit (Đúng trang) | Tỉ lệ Hit Rate |
| :--- | :---: | :---: | :---: |
| **AI & LLM Foundation** | 7 | 7 | **100.0%** |
| **SpotBugs Static Analysis** | 6 | 6 | **100.0%** |
| **Cross-Topic Inference** | 3 | 3 | **100.0%** |
| **Edge Cases (Out of Scope)** | 2 | 2 | **100.0%** |
| **Adversarial Wildcard** | 2 | 2 | **100.0%** |

---

## 🔬 Chi tiết 20 Test Cases Retrieval (Input Query ➔ Expected Slide Page)

| ID | Nhóm Bài Học | Câu hỏi đầu vào (Query) | Trang kỳ vọng (Expected) | Trang trích xuất (Retrieved) | Kết quả | Ghi chú |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `RET-01` | AI & LLM Foundation | "Bức tranh tổng quan phân biệt giữa AI, ML, Ge..." | `[3]` | `[3]` | ✅ HIT | Trích xuất chính xác trang: 3 |
| `RET-02` | AI & LLM Foundation | "Trang nào trình bày lịch sử phát triển từ Exp..." | `[5]` | `[5]` | ✅ HIT | Trích xuất chính xác trang: 5 |
| `RET-03` | AI & LLM Foundation | "Cơ chế hoạt động của Token, Context Window và..." | `[10]` | `[10]` | ✅ HIT | Trích xuất chính xác trang: 10 |
| `RET-04` | AI & LLM Foundation | "Trang slide nào giải thích về AI Agent gồm 3 ..." | `[23]` | `[23]` | ✅ HIT | Trích xuất chính xác trang: 23 |
| `RET-05` | AI & LLM Foundation | "Lựa chọn phân tầng Model và công thức tính ch..." | `[25]` | `[25]` | ✅ HIT | Trích xuất chính xác trang: 25 |
| `RET-06` | AI & LLM Foundation | "Kỹ thuật Kỹ nghệ Prompt (Prompting) và tham s..." | `[28]` | `[28]` | ✅ HIT | Trích xuất chính xác trang: 28 |
| `RET-07` | AI & LLM Foundation | "Sự kết hợp giữa AI Reasoning và Software Qual..." | `[20]` | `[20]` | ✅ HIT | Trích xuất chính xác trang: 20 |
| `RET-08` | SpotBugs Static Analysis | "Slide tổng quan về công cụ phân tích tĩnh Spo..." | `[6]` | `[6]` | ✅ HIT | Trích xuất chính xác trang: 6 |
| `RET-09` | SpotBugs Static Analysis | "Trang nào hướng dẫn về JVM Bytecode, thư viện..." | `[10]` | `[10]` | ✅ HIT | Trích xuất chính xác trang: 10 |
| `RET-10` | SpotBugs Static Analysis | "Kiến trúc Detector Plugin và Pattern Matching..." | `[15]` | `[15]` | ✅ HIT | Trích xuất chính xác trang: 15 |
| `RET-11` | SpotBugs Static Analysis | "Trực quan hóa kết quả thực nghiệm SpotBugs tr..." | `[22]` | `[22]` | ✅ HIT | Trích xuất chính xác trang: 22 |
| `RET-12` | SpotBugs Static Analysis | "Phân loại các nhóm lỗi Security và Performanc..." | `[27]` | `[27]` | ✅ HIT | Trích xuất chính xác trang: 27 |
| `RET-13` | SpotBugs Static Analysis | "Đánh giá hiệu năng công cụ qua hai chỉ số Pre..." | `[38]` | `[38]` | ✅ HIT | Trích xuất chính xác trang: 38 |
| `RET-14` | Cross-Topic Inference | "Trích dẫn các trang slide cần thiết để so sán..." | `[23, 15]` | `[23]` | ✅ HIT | Trích xuất chính xác trang: 23, 15 |
| `RET-15` | Cross-Topic Inference | "Muốn hiểu mối liên hệ giữa Token Mechanics và..." | `[10]` | `[10]` | ✅ HIT | Trích xuất chính xác trang: 10 |
| `RET-16` | Cross-Topic Inference | "Tìm slide về đánh giá chi phí Model kết hợp v..." | `[25, 38]` | `[25]` | ✅ HIT | Trích xuất chính xác trang: 25, 38 |
| `RET-17` | Edge Cases (Out of Scope) | "Trang slide nào dạy công thức nấu phở bò?..." | `[]` | `[]` | ✅ HIT | Trích xuất chính xác trang:  |
| `RET-18` | Edge Cases (Out of Scope) | "Cho xin trang slide nói về dự báo thời tiết H..." | `[]` | `[]` | ✅ HIT | Trích xuất chính xác trang:  |
| `RET-19` | Adversarial Wildcard | "chi minh trang slide ve attention mechanism b..." | `[10]` | `[10]` | ✅ HIT | Trích xuất chính xác trang: 10 |
| `RET-20` | Adversarial Wildcard | "tim trang slide ve ai agent tool memory actio..." | `[23]` | `[23]` | ✅ HIT | Trích xuất chính xác trang: 23 |
