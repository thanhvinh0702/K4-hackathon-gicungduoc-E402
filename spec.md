# 02. Product Specification — VLearn

## 1. Bài toán

Hiện tại, chatbot học tập chỉ sử dụng nội dung và lịch sử trò chuyện của từng bộ slide riêng lẻ. Khi người dùng đặt câu hỏi cần tổng hợp hoặc liên kết kiến thức từ nhiều bộ slide, chatbot không có đủ ngữ cảnh để đưa ra câu trả lời chính xác và đầy đủ.

Người dùng mục tiêu là học viên đã có nhiều tài liệu PDF trong cùng một môn học và muốn hỏi kiến thức mà không phải tự mở, tìm kiếm và đối chiếu từng file.

### Tác hại

- Người học nhận được câu trả lời thiếu chính xác hoặc không đầy đủ khi câu hỏi liên quan đến nhiều bộ slide.
- Kiến thức bị tiếp cận rời rạc, khiến người học khó hiểu mối liên hệ giữa các khái niệm trong bài học.
- Người học phải tự mở nhiều PDF, tìm từng trang và ghép thông tin, làm mất thời gian và giảm giá trị của AI Tutor.
- Câu trả lời không chỉ ra đúng tài liệu và trang nguồn làm người học khó kiểm chứng, đồng thời dễ tin vào nội dung nghe hợp lý nhưng thiếu căn cứ.

### Job to be done

Khi cần hiểu một vấn đề có kiến thức nằm rải rác trong nhiều bộ slide, người học muốn đặt một câu hỏi duy nhất để nhận được câu trả lời tổng hợp, có căn cứ và có thể mở đúng từng trang nguồn để kiểm chứng.

## 2. Bằng chứng

**27/55 người đã sử dụng AI Tutor (49,1%)** chọn vấn đề:

> “Chatbot chỉ sử dụng nội dung và lịch sử trò chuyện của từng slide riêng lẻ nên không thể tổng hợp hoặc liên kết thông tin từ nhiều slide để trả lời đầy đủ, chính xác.”

Cách đo:

1. Thu được tổng cộng 57 phản hồi khảo sát.
2. Loại 2 người trả lời “chưa dùng” AI Tutor, còn 55 người đã sử dụng.
3. Trong câu hỏi nhiều lựa chọn **“Vấn đề mà bạn đang gặp phải khi sử dụng AI Tutor trên Vlearn (Có thể chọn nhiều đáp án)”**, lọc những phản hồi chọn đúng phương án trên.
4. Có 27 phản hồi phù hợp, tương đương `27 / 55 × 100 = 49,1%`.

Số liệu cho thấy đây không phải trường hợp cá biệt: gần một nửa số người đã sử dụng AI Tutor gặp khó khăn khi cần tổng hợp kiến thức vượt ra ngoài một bộ slide riêng lẻ.

## 3. Lát cắt sản phẩm MVP

VLearn tập trung giải quyết một lát cắt duy nhất: **hỏi đáp và liên kết kiến thức trên nhiều bộ slide PDF đã tải lên**.

### Luồng chính

1. Người dùng tải ít nhất hai bộ slide PDF lên VLearn.
2. Backend lưu PDF trên filesystem, trích xuất nội dung theo trang, chia chunk và tạo embedding.
3. Tại chatbot trang chủ, người dùng chọn chế độ `Agentic` và đặt câu hỏi cần kiến thức từ nhiều slide hoặc nhiều trang.
4. Agent sử dụng các công cụ tìm kiếm kho slide, đọc trang và liệt kê tài liệu để thu thập đủ ngữ cảnh.
5. Hệ thống trả lời bằng nội dung tổng hợp, kèm tên bài học và liên kết mở đúng trang nguồn.
6. Người dùng bấm nguồn để chuyển trực tiếp đến PDF và trang cần kiểm chứng.

Chế độ `Fast` được giữ cho câu hỏi đơn giản chỉ cần một lượt truy xuất. Người dùng chủ động chọn mode; hệ thống không dùng LLM router để quyết định thay người dùng.

### Tình huống chứng minh quan trọng nhất

Người dùng hỏi một câu có chuỗi suy luận qua nhiều tài liệu, chẳng hạn:

> Trong phần RAG Context Pattern, Agent dùng `search_kb` để lấy context khi cần. Theo bài học về AI Agent, khả năng này thuộc cấp độ Agent nào, tương ứng với bộ phận nào của Agent, và model, ứng dụng, công cụ thực hiện các bước gì để tạo câu trả lời cuối cùng?

VLearn phải tìm được phần mô tả `search_kb` trong slide Prompt Engineering, tiếp tục tìm phần phân loại và cấu tạo Agent trong slide AI Foundation, sau đó tổng hợp và dẫn đúng trang cho từng ý. Nếu chỉ trả lời từ một đoạn tìm thấy đầu tiên thì lát cắt chưa đạt.

### Trong phạm vi MVP

- Tải lên và đọc nhiều PDF.
- Trích xuất text, chunking, embedding và semantic retrieval.
- Chat trên toàn bộ thư viện hoặc trong một bài học.
- Fast RAG và Agentic RAG do người dùng lựa chọn.
- Trả lời có nguồn gồm bài học, số trang và liên kết mở trang.
- Golden set và script eval để đo kết quả có thể lặp lại.

### Ngoài phạm vi MVP

- Database, tài khoản, phân quyền và đồng bộ nhiều thiết bị.
- OCR cho PDF scan không có text.
- Tự động sinh mind map từ nội dung thật.
- Đồng bộ lịch sử hội thoại vào context nhiều lượt của model.
- Tìm kiếm web hoặc trả lời bằng nguồn ngoài các slide đã tải lên.

## 4. Quality bar

MVP chỉ được xem là giải quyết đúng bài toán khi đạt đồng thời các tiêu chí sau:

| Tiêu chí | Ngưỡng đạt | Cách đo |
| --- | ---: | --- |
| Câu hỏi liên kết nhiều slide | Ít nhất **3/4 câu đạt** | Chạy các case `RET-14`, `RET-15`, `RET-16`, `RET-21` trong `eval/golden_set.json`; phải lấy đủ tài liệu và trang kỳ vọng. |
| Kết quả toàn bộ golden set | Ít nhất **17/21 câu đạt** | Chạy toàn bộ golden set bằng luồng sản phẩm thật, không bỏ các câu fail. |
| Định vị đúng tài liệu | **≥ 90%** | So sánh `retrieved_slide_ids` với `expected_slide_id`. |
| Trích dẫn đúng trang | **≥ 80%** | Mọi trang trong `expected_pages` phải xuất hiện trong `retrieved_pages`. |
| Nguồn có thể kiểm chứng | **100% câu có căn cứ** | Mỗi nguồn phải có `lessonId`, số trang và mở được đúng PDF tại trang tương ứng; nếu không có căn cứ thì phải nói không tìm thấy. |
| Độ trễ Agentic RAG | Trung bình **≤ 30 giây/câu** | Đo `latency_ms` trên cùng một lần chạy golden set và cùng cấu hình model. |

Lệnh đo chuẩn:

```bash
.venv/bin/python eval/run_eval.py --mode agentic_rag
```

Một test case chỉ được tính là đạt khi truy xuất đúng tài liệu, có đầy đủ các trang kỳ vọng và không phát sinh lỗi. Bảng kết quả phải lưu cả câu đạt lẫn câu fail trong `eval/`.

### Baseline hiện tại

Lần chạy đầy đủ gần nhất trong `eval/results_v2.json` đạt:

- **15/20 câu** tổng thể (`75%`).
- **95%** độ chính xác tài liệu.
- **75%** độ chính xác trang trích dẫn.
- **1/3 câu** Cross-Topic Inference đạt.
- Độ trễ trung bình **25.010 ms**, tương đương khoảng **25 giây/câu**.

Case `RET-21` được bổ sung sau lần chạy trên nên chưa được tính vào baseline. Vì vậy sản phẩm hiện **chưa đạt quality bar**, chủ yếu do chưa lấy đủ trang ở các câu hỏi cần liên kết nhiều nguồn. Đây là khoảng cách quan trọng nhất cần cải thiện và đo lại.
