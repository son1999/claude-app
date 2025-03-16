# Hướng dẫn khởi động Claude AI Clone

Dưới đây là các bước chi tiết để cài đặt và chạy dự án Claude AI Clone.

## Cài đặt với Docker

### Yêu cầu
- Docker & Docker Compose
- Anthropic API Key (bạn có thể đăng ký tại [Anthropic Console](https://console.anthropic.com/))

### Các bước
1. Clone repository:
```bash
git clone <repository-url>
cd claude-clone-project
```

2. Tạo file `.env` và thêm API key của Anthropic:
```bash
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
```

3. Khởi động với Docker Compose:
```bash
docker-compose up -d
```

4. Truy cập ứng dụng:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

5. Để dừng ứng dụng:
```bash
docker-compose down
```

## Cài đặt thủ công

### Yêu cầu
- Node.js v16+ 
- npm hoặc yarn
- PostgreSQL
- Anthropic API Key

### Backend
1. Cài đặt PostgreSQL và tạo database:
```bash
createdb claude_db
```

2. Cấu hình backend:
```bash
cd claude-backend
cp .env.example .env
```

3. Chỉnh sửa file `.env` và thêm API key của Anthropic:
```
ANTHROPIC_API_KEY=your_api_key_here
```

4. Cài đặt dependencies và biên dịch TypeScript:
```bash
npm install
npm run build
```

5. Chạy server:
```bash
npm start
```

### Frontend
1. Mở terminal mới và di chuyển đến thư mục frontend:
```bash
cd claude-clone
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy ứng dụng:
```bash
npm start
```

4. Truy cập frontend tại http://localhost:3000

## API Endpoints

### Backend API

#### Chat
- `GET /api/chats` - Lấy danh sách chat
- `POST /api/chats` - Tạo chat mới
- `GET /api/chats/:id` - Lấy thông tin chi tiết của một chat
- `POST /api/chats/:id/messages` - Gửi tin nhắn trong một chat
- `DELETE /api/chats/:id` - Xóa một chat

#### Models
- `GET /api/models` - Lấy danh sách các mô hình AI

## Xử lý lỗi

### Không thể kết nối đến database
- Kiểm tra PostgreSQL đã chạy chưa
- Kiểm tra thông tin kết nối trong file `.env`

### API Key không hợp lệ
- Kiểm tra API key của Anthropic trong file `.env`
- Đảm bảo API key chưa hết hạn

### File upload không hoạt động
- Kiểm tra thư mục `uploads` đã được tạo và có quyền ghi

## Phát triển

### Backend
- Sử dụng `npm run dev` để chạy với nodemon (hot reload)

### Frontend
- Sử dụng `npm start` để chạy với react-scripts (hot reload) 