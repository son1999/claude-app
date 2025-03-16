# Claude API Backend

Backend API cho ứng dụng Claude Clone, sử dụng Node.js, Express, TypeScript và PostgreSQL.

## Tính năng

- Chat với Claude AI
- Lưu trữ lịch sử chat
- Đính kèm file (hình ảnh, PDF, văn bản)
- Liệt kê các mô hình AI có sẵn

## Yêu cầu

- Node.js 16+
- PostgreSQL
- Docker và Docker Compose (tùy chọn)

## Cài đặt

### Sử dụng Docker

1. Clone repository:
```bash
git clone <repository-url>
cd claude-backend
```

2. Cấu hình API key:
```bash
# Thêm API key của Anthropic vào file .env
echo "ANTHROPIC_API_KEY=your_api_key_here" >> .env
```

3. Khởi động với Docker Compose:
```bash
docker-compose up -d
```

### Cài đặt thủ công

1. Clone repository:
```bash
git clone <repository-url>
cd claude-backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Cấu hình biến môi trường:
```bash
cp .env.example .env
# Chỉnh sửa file .env với thông tin cấu hình của bạn
```

4. Biên dịch TypeScript:
```bash
npm run build
```

5. Khởi động server:
```bash
npm start
```

## API Endpoints

### Chat

- `GET /api/chats` - Lấy danh sách chat
- `POST /api/chats` - Tạo chat mới
- `GET /api/chats/:id` - Lấy thông tin chi tiết của một chat
- `POST /api/chats/:id/messages` - Gửi tin nhắn trong một chat
- `DELETE /api/chats/:id` - Xóa một chat

### Models

- `GET /api/models` - Lấy danh sách các mô hình AI

## Phát triển

Để chạy ở chế độ phát triển với hot-reload:

```bash
npm run dev
```

## Giấy phép

MIT 