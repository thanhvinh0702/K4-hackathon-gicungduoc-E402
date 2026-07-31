# 06. Feedback log từ vòng user test
## 1. Mục tiêu

Kiểm tra xem người học có thể hoàn thành luồng giá trị cốt lõi của VLearn hay không:

1. Tải ít nhất hai bộ slide PDF lên thư viện.
2. Chọn chế độ Agentic và đặt câu hỏi cần liên kết nhiều tài liệu.
3. Hiểu câu trả lời tổng hợp và mở đúng trang nguồn để kiểm chứng.
4. Phân biệt khi nào nên dùng Fast và khi nào nên dùng Agentic.
5. Tìm lại cuộc trò chuyện trước đó.

## 2. Thiết kế vòng test mô phỏng

| Thuộc tính | Giá trị |
| --- | --- |
| Số người tham gia | 12 (`UT01`–`UT12`) |
| Nhóm người dùng | 12 học viên |
| Hình thức | Moderated usability test, mỗi phiên 20–25 phút |
| Thiết bị | 12 laptop |
| Thang đánh giá | Hoàn thành / hoàn thành có trợ giúp / không hoàn thành |
| Phạm vi | Upload PDF, thư viện, Fast RAG, Agentic RAG, trích dẫn nguồn, lịch sử chat |

### Nhiệm vụ và kết quả

| ID | Nhiệm vụ | Hoàn thành độc lập | Có trợ giúp | Không hoàn thành | Tỷ lệ hoàn thành |
| --- | --- | ---: | ---: | ---: | ---: |
| T1 | Tải hai PDF và kiểm tra chúng xuất hiện trong thư viện | 10 | 1 | 1 | 91,7% |
| T2 | Dùng Agentic để hỏi một câu cần tổng hợp hai bài học | 7 | 1 | 4 | 66,7% |
| T3 | Mở nguồn và đi đến đúng trang được trích dẫn | 9 | 1 | 2 | 83,3% |
| T4 | Chọn đúng Fast hoặc Agentic cho hai loại câu hỏi | 6 | 1 | 5 | 58,3% |
| T5 | Tìm lại một cuộc trò chuyện đã tạo | 8 | 1 | 3 | 75,0% |

Tổng cộng có **45/60 lượt nhiệm vụ hoàn thành**, tương đương **75,0%**. Điểm nghẽn lớn nhất không nằm ở thao tác tải tài liệu mà ở việc hiểu sự khác nhau giữa hai chế độ truy xuất và chờ câu trả lời Agentic.

## 3. Tổng hợp feedback

Log chi tiết gồm **18 feedback item** trong [`feedback_log.csv`](./feedback_log.csv).

| Mức độ | Số lượng | Diễn giải |
| --- | ---: | --- |
| P0 — Critical | 1 | Làm sai hoặc phá vỡ giá trị cốt lõi của sản phẩm |
| P1 — High | 4 | Cản trở đáng kể việc hoàn thành nhiệm vụ chính |
| P2 — Medium | 9 | Gây nhầm lẫn hoặc làm trải nghiệm chậm hơn |
| P3 — Low | 4 | Cải thiện nhỏ về nội dung hoặc giao diện |

| Trạng thái | Số lượng |
| --- | ---: |
| Done | 7 |
| Planned | 6 |
| Open | 5 |

### Những gì người dùng đánh giá tốt

- 10/12 người hiểu ngay thao tác tải PDF và nhận ra tài liệu vừa thêm trong thư viện.
- 9/12 người tự mở được nguồn từ câu trả lời và đánh giá việc nhảy đúng trang là hữu ích.
- Giao diện thư viện, tiêu đề bài học và các gợi ý câu hỏi giúp người mới bắt đầu nhanh.
- Khi câu trả lời có nhiều nguồn, người dùng tin tưởng hơn vì có thể kiểm chứng từng ý.

### Vấn đề nổi bật

1. **Agentic đôi khi chưa lấy đủ nguồn cho câu hỏi liên kết nhiều slide (P0).** Đây cũng là khoảng cách đã xuất hiện trong golden set: baseline mới đạt 1/3 câu Cross-Topic Inference.
2. **Fast và Agentic chưa tự giải thích (P1).** 5/12 người chọn sai mode ít nhất một lần; tên tiếng Anh không cho biết khác biệt về tốc độ, độ sâu và phạm vi tìm kiếm.
3. **Thiếu trạng thái tiến trình khi Agentic chạy lâu (P1).** Người dùng không biết hệ thống đang tìm kiếm hay đã bị treo và có xu hướng gửi lại câu hỏi.
4. **Nguồn trích dẫn chưa cho biết nguồn hỗ trợ ý nào (P1).** Khi có nhiều nguồn, người dùng phải tự đối chiếu nội dung với từng trang.
5. **Trải nghiệm trên màn hình hẹp chưa ổn định (P1).** Khung PDF và trợ lý cạnh nhau khiến nội dung khó đọc trên máy tính bảng.

## 4. Quyết định sản phẩm sau vòng test

| Ưu tiên | Quyết định | Feedback liên quan | Tiêu chí hoàn thành |
| --- | --- | --- | --- |
| P0 | Tăng độ phủ retrieval cho câu hỏi nhiều tài liệu | `FB-001` | Đạt ít nhất 3/4 case `RET-14`, `RET-15`, `RET-16`, `RET-21` |
| P1 | Thêm mô tả ngắn ngay trong bộ chọn mode | `FB-002`, `FB-003` | ≥ 10/12 người chọn đúng mode ở vòng test kế tiếp |
| P1 | Hiển thị tiến trình Agentic: đang tìm, đang đọc, đang tổng hợp | `FB-004`, `FB-005` | Không còn thao tác gửi lặp do tưởng hệ thống treo |
| P1 | Gắn số nguồn vào từng luận điểm và làm nổi bật nguồn đang mở | `FB-006`, `FB-007` | ≥ 11/12 người ghép đúng luận điểm với nguồn |
| P1 | Đổi layout tablet sang PDF/chat dạng tab | `FB-008` | Hoàn thành T3 trên cả 3 thiết bị tablet |
| P2 | Làm rõ trạng thái xử lý file và lỗi upload | `FB-009`, `FB-010` | Người dùng biết file đang xử lý hay cần thử lại |

## 5. Những thay đổi đã phản ánh trong MVP

- Giữ lựa chọn Fast/Agentic ở cả chatbot trang chủ và chatbot theo bài học.
- Nguồn trả lời có tên bài học, số trang và liên kết mở trực tiếp PDF.
- Lưu nhiều cuộc trò chuyện và cho phép tạo/xóa cuộc trò chuyện.
- Hiển thị trạng thái xử lý sau khi upload và không đưa bài học chưa xử lý vào retrieval.
- Thêm gợi ý câu hỏi để giảm trạng thái trống cho người dùng mới.

## 6. Kế hoạch validation tiếp theo

Sau khi xử lý các mục P0/P1, chạy vòng test thứ hai với tối thiểu 5 người dùng thật và giữ nguyên năm nhiệm vụ để so sánh. Ngưỡng đạt đề xuất:

- Ít nhất 85% tổng số nhiệm vụ được hoàn thành.
- 100% người dùng mở được ít nhất một nguồn đúng trang.
- Ít nhất 80% người dùng chọn đúng Fast/Agentic mà không cần moderator giải thích.
- Không có lỗi P0 mới; `FB-001` vượt quality bar trong `spec.md`.
