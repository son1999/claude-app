# Claude AI Clone

Dự án clone giao diện và chức năng của Claude AI bằng ReactJS và NodeJS.

## Giới thiệu

Claude AI Clone là một ứng dụng web mô phỏng trợ lý AI Claude của Anthropic, bao gồm:

- **Frontend**: Xây dựng bằng ReactJS, TypeScript, TailwindCSS, và Zustand
- **Backend**: Xây dựng bằng NodeJS, Express, TypeScript, và Sequelize

## Cấu trúc dự án

```
claude-clone/      # Frontend
  ├── public/
  ├── src/
  │   ├── components/
  │   ├── pages/
  │   ├── store/
  │   ├── services/
  │   └── ...
  └── ...

claude-backend/    # Backend
  ├── src/
  │   ├── config/
  │   ├── controllers/
  │   ├── models/
  │   ├── routes/
  │   ├── services/
  │   └── ...
  ├── uploads/
  └── ...
```

## Tính năng

- Giao diện giống Claude AI
- Chat với API Claude từ Anthropic
- Quản lý nhiều cuộc trò chuyện
- Đính kèm file (hình ảnh, PDF, văn bản)
- Lựa chọn mô hình AI để sử dụng
- Lưu trữ lịch sử chat với PostgreSQL

## Cài đặt và chạy

### Sử dụng Docker Compose

1. Clone repository:
```bash
git clone <repository-url>
cd claude-clone-project
```

2. Cấu hình API key:
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

### Cài đặt thủ công

1. Cài đặt và chạy Backend:
```bash
cd claude-backend
npm install
npm run build
npm start
```

2. Cài đặt và chạy Frontend:
```bash
cd claude-clone
npm install
npm start
```

## Công nghệ sử dụng

### Frontend
- ReactJS
- TypeScript
- TailwindCSS
- Zustand (State Management)
- React Router

### Backend
- Node.js
- Express
- TypeScript
- Sequelize (ORM)
- PostgreSQL
- Docker

## Giấy phép

MIT 