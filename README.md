# VLearn

Ứng dụng web nhỏ để tải slide PDF lên máy chủ, chọn bài học từ thư viện và xem trực tiếp trong trình duyệt.

## Chạy ứng dụng

Yêu cầu Node.js 18 trở lên.

```bash
npm install
npm start
```

Mở `http://localhost:3000`.

PDF được lưu trong thư mục `uploads/`; thông tin bài học nằm trong `uploads/lessons.json`. Giới hạn mỗi tệp là 50 MB.
