# Kết quả đánh giá VLearn Agentic RAG - V2

## Thông tin lần chạy

| Thuộc tính | Giá trị |
|---|---|
| Thời điểm đánh giá | `2026-07-31T04:10:23.638706Z` |
| Trạng thái | Hoàn thành |
| Engine | VLearn LangChain Agentic RAG |
| Chat model | `openrouter/deepseek/deepseek-v4-flash` |
| Embedding model | `openrouter/openai/text-embedding-3-large` |

## Tổng quan

| Chỉ số | Kết quả |
|---|---:|
| Số câu đạt | **15/20** |
| Tỷ lệ đạt | **75.0%** |
| Độ chính xác tài liệu | 95.0% |
| Độ chính xác trích dẫn trang | 75.0% |
| Độ trễ trung bình | 25,010 ms |
| Số lỗi hệ thống | 0 |

## Kết quả theo nhóm

| Nhóm câu hỏi | Đạt | Tổng | Tỷ lệ |
|---|---:|---:|---:|
| AI & LLM Foundation | 6 | 7 | 85.7% |
| SpotBugs Static Analysis | 4 | 6 | 66.7% |
| Cross-Topic Inference | 1 | 3 | 33.3% |
| Edge Cases (Out of Scope) | 2 | 2 | 100.0% |
| Adversarial Wildcard | 2 | 2 | 100.0% |

## Bảng kết quả đầy đủ

| ID | Nhóm | Độ khó | Kết quả | Trang kỳ vọng | Trang truy xuất | Đúng tài liệu | Đúng trang | Độ trễ |
|---|---|---|---|---|---|---|---|---:|
| RET-01 | AI & LLM Foundation | Easy | Đạt | 3 | 3 | Có | Có | 11,621 ms |
| RET-02 | AI & LLM Foundation | Easy | Đạt | 5 | 9, 6, 5 | Có | Có | 26,734 ms |
| RET-03 | AI & LLM Foundation | Medium | Đạt | 13, 14, 15 | 13, 14, 15, 16 | Có | Có | 18,921 ms |
| RET-04 | AI & LLM Foundation | Easy | Đạt | 24 | 24 | Có | Có | 21,926 ms |
| RET-05 | AI & LLM Foundation | Medium | Đạt | 26, 27 | 26, 27 | Có | Có | 21,075 ms |
| RET-06 | AI & LLM Foundation | Easy | Đạt | 28, 29 | 28, 29, 17 | Có | Có | 17,767 ms |
| RET-07 | AI & LLM Foundation | Hard | **Không đạt** | 22, 5 | 16, 27 | Không | Không | 26,746 ms |
| RET-08 | SpotBugs Static Analysis | Easy | Đạt | 6, 14 | 6, 7, 8, 14, 3 | Có | Có | 11,524 ms |
| RET-09 | SpotBugs Static Analysis | Medium | Đạt | 10, 11, 13 | 10, 11, 12, 13, 14, 18 | Có | Có | 19,299 ms |
| RET-10 | SpotBugs Static Analysis | Medium | Đạt | 15, 17, 18 | 17, 18, 14, 15, 19 | Có | Có | 26,246 ms |
| RET-11 | SpotBugs Static Analysis | Medium | **Không đạt** | 24, 25, 26 | 23, 25, 26, 39 | Có | Không | 25,053 ms |
| RET-12 | SpotBugs Static Analysis | Easy | **Không đạt** | 8 | 32, 26, 31 | Có | Không | 63,919 ms |
| RET-13 | SpotBugs Static Analysis | Easy | Đạt | 39 | 38, 39 | Có | Có | 11,830 ms |
| RET-14 | Cross-Topic Inference | Hard | **Không đạt** | 24, 15 | 4, 24 | Có | Không | 59,485 ms |
| RET-15 | Cross-Topic Inference | Hard | Đạt | 13, 10, 11 | 13, 12, 27, 15, 19, 10, 11 | Có | Có | 25,507 ms |
| RET-16 | Cross-Topic Inference | Hard | **Không đạt** | 26, 27, 39 | 25, 26, 27, 23 | Có | Không | 27,816 ms |
| RET-17 | Edge Cases (Out of Scope) | Easy | Đạt | - | - | Có | Có | 23,313 ms |
| RET-18 | Edge Cases (Out of Scope) | Easy | Đạt | - | - | Có | Có | 15,165 ms |
| RET-19 | Adversarial Wildcard | Hard | Đạt | 15 | 15, 16, 8 | Có | Có | 19,795 ms |
| RET-20 | Adversarial Wildcard | Hard | Đạt | 24 | 24, 4 | Có | Có | 26,456 ms |

## Chi tiết các câu chưa đạt

### RET-07 - AI Reasoning và Software Quality

- Câu hỏi: Sự kết hợp giữa AI Reasoning và Software Quality được đề cập ở trang nào?
- Kỳ vọng: tài liệu `AI & LLM Foundation`, trang 22 và 5.
- Thực tế: tài liệu `d2-slide-hackathon`, trang 16 và 27.
- Nguyên nhân: truy xuất sai tài liệu và không tìm thấy các trang kỳ vọng.

### RET-11 - Kết quả SpotBugs trên IntelliJ và HTML Report

- Câu hỏi: Trực quan hóa kết quả thực nghiệm SpotBugs trên IntelliJ và HTML Report ở trang mấy?
- Kỳ vọng: trang 24, 25 và 26.
- Thực tế: trang 23, 25, 26 và 39.
- Nguyên nhân: đúng tài liệu nhưng thiếu trang 24.

### RET-12 - Nhóm lỗi Security và Performance

- Câu hỏi: Phân loại các nhóm lỗi Security và Performance nằm ở slide nào?
- Kỳ vọng: trang 8.
- Thực tế: trang 32, 26 và 31.
- Nguyên nhân: đúng tài liệu nhưng không truy xuất trang tổng quan 8.

### RET-14 - AI Agent và Detector Architecture

- Câu hỏi: Trích dẫn các trang slide cần thiết để so sánh AI Agent với Detector Architecture?
- Kỳ vọng: trang 24 của AI & LLM Foundation và trang 15 của SpotBugs.
- Thực tế: chỉ truy xuất trang 4 và 24 của AI & LLM Foundation.
- Nguyên nhân: thiếu tài liệu SpotBugs và trang 15.

### RET-16 - Chi phí Model và Precision/Recall

- Câu hỏi: Tìm slide về đánh giá chi phí Model kết hợp với đánh giá độ chính xác Precision/Recall?
- Kỳ vọng: trang 26, 27 và 39.
- Thực tế: trang 25, 26, 27 và 23; không có trang 39 của SpotBugs.
- Nguyên nhân: truy xuất được phần chi phí model nhưng thiếu phần Precision/Recall.

## Nhận xét

- Hệ thống đạt **15/20 câu**, không phát sinh lỗi kỹ thuật.
- Các câu đơn tài liệu và câu ngoài phạm vi hoạt động tốt.
- Điểm yếu chính nằm ở truy vấn cần kết hợp nhiều tài liệu: nhóm Cross-Topic Inference chỉ đạt 1/3 câu.
- RET-12 và RET-14 có độ trễ cao nhất, lần lượt là 63,919 ms và 59,485 ms.
