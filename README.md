# Claude AI Clone

## Giới thiệu
Đây là một ứng dụng clone của Claude AI, cho phép bạn tương tác với các mô hình ngôn ngữ lớn của Claude. Ứng dụng bao gồm frontend (Vue.js), backend (Node.js/Express) và cơ sở dữ liệu (PostgreSQL).

## Cài đặt

### Yêu cầu
- Docker và Docker Compose
- Node.js (phiên bản 18 trở lên) cho phát triển local

### Cách cài đặt
1. Clone repository này
2. Tạo file `.env` từ `.env.example`
3. Chạy ứng dụng với Docker Compose:

```bash
./run.sh
```

## Cấu hình môi trường

### File .env cho Frontend
Frontend sử dụng các biến môi trường sau trong file `.env`:

- `VITE_API_URL`: URL của backend API
- `VITE_APP_TITLE`: Tiêu đề của ứng dụng
- `VITE_APP_DESCRIPTION`: Mô tả ứng dụng

### File .env cho Backend 
Backend sử dụng các biến môi trường sau:

- `DB_HOST`: Host của PostgreSQL
- `DB_USER`: Tên người dùng PostgreSQL
- `DB_PASSWORD`: Mật khẩu PostgreSQL
- `DB_NAME`: Tên database
- `API_KEY`: API key của Claude API
- `PORT`: Port chạy backend

### Bảo mật thông tin nhạy cảm

**QUAN TRỌNG**: Để đảm bảo thông tin nhạy cảm không bị lộ ra, hãy tuân thủ các quy tắc sau:

1. **KHÔNG** commit file `.env` lên Git. File này đã được thêm vào `.gitignore`.
2. Sử dụng file `.env.example` làm template, sao chép thành `.env` và điền thông tin thực.
3. **KHÔNG** hardcode API key hay thông tin nhạy cảm trong code hoặc docker-compose.yml.
4. Khi phát triển, tạo file `.env` cục bộ từ `.env.example`:
   ```bash
   cp claude-backend/.env.example claude-backend/.env
   # Sau đó chỉnh sửa để thêm API key thực
   ```
5. Khi triển khai lên máy chủ, sử dụng biến môi trường hệ thống hoặc các giải pháp quản lý bí mật như Docker secrets, HashiCorp Vault, AWS Secrets Manager, v.v.

## Phát triển

### Frontend
- Chạy frontend ở chế độ development:
```bash
cd claude-frontend
npm install
npm run dev
```

### Backend
- Chạy backend ở chế độ development:
```bash
cd claude-backend
npm install
npm run dev
```

## Cấu trúc dự án

### Frontend
```
claude-frontend/
├── public/               # Tài nguyên tĩnh
├── src/
│   ├── assets/           # Hình ảnh, CSS, v.v.
│   ├── components/       # Các thành phần Vue
│   ├── stores/           # Kho lưu trữ Pinia
│   ├── utils/            # Tiện ích
│   ├── App.vue           # Thành phần gốc
│   └── main.js           # Điểm vào ứng dụng
```

### Backend
```
claude-backend/
├── src/
│   ├── config/           # Cấu hình
│   ├── controllers/      # Bộ điều khiển API
│   ├── models/           # Mô hình dữ liệu
│   ├── routes/           # Định nghĩa tuyến API
│   ├── utils/            # Tiện ích
│   └── index.ts          # Điểm vào ứng dụng
```

## API Endpoints

### Chats
- GET `/api/chats`: Lấy tất cả các cuộc trò chuyện
- POST `/api/chats`: Tạo cuộc trò chuyện mới
- GET `/api/chats/:id`: Lấy chi tiết cuộc trò chuyện
- DELETE `/api/chats/:id`: Xóa cuộc trò chuyện

### Models
- GET `/api/models`: Lấy danh sách các mô hình AI
- GET `/api/models/details/:id`: Lấy chi tiết mô hình

## Docker

Ứng dụng này được containerized với Docker, gồm 3 dịch vụ:
- `frontend`: Ứng dụng Vue.js
- `backend`: API NodeJS/Express
- `db`: Cơ sở dữ liệu PostgreSQL

# English Version

## Introduction
This is a clone of Claude AI, allowing you to interact with Claude's large language models. The application includes a frontend (Vue.js), backend (Node.js/Express), and database (PostgreSQL).

## Installation

### Requirements
- Docker and Docker Compose
- Node.js (version 18 or later) for local development

### How to Install
1. Clone this repository
2. Create a `.env` file from `.env.example`
3. Run the application with Docker Compose:

```bash
./run.sh
```

## Environment Configuration

### Frontend .env File
The frontend uses the following environment variables in the `.env` file:

- `VITE_API_URL`: Backend API URL
- `VITE_APP_TITLE`: Application title
- `VITE_APP_DESCRIPTION`: Application description

### Backend .env File
The backend uses the following environment variables:

- `DB_HOST`: PostgreSQL host
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_NAME`: Database name
- `API_KEY`: Claude API key
- `PORT`: Backend port

### Bảo mật thông tin nhạy cảm

**QUAN TRỌNG**: Để đảm bảo thông tin nhạy cảm không bị lộ ra, hãy tuân thủ các quy tắc sau:

1. **KHÔNG** commit file `.env` lên Git. File này đã được thêm vào `.gitignore`.
2. Sử dụng file `.env.example` làm template, sao chép thành `.env` và điền thông tin thực.
3. **KHÔNG** hardcode API key hay thông tin nhạy cảm trong code hoặc docker-compose.yml.
4. Khi phát triển, tạo file `.env` cục bộ từ `.env.example`:
   ```bash
   cp claude-backend/.env.example claude-backend/.env
   # Sau đó chỉnh sửa để thêm API key thực
   ```
5. Khi triển khai lên máy chủ, sử dụng biến môi trường hệ thống hoặc các giải pháp quản lý bí mật như Docker secrets, HashiCorp Vault, AWS Secrets Manager, v.v.

## Development

### Frontend
- Run frontend in development mode:
```bash
cd claude-frontend
npm install
npm run dev
```

### Backend
- Run backend in development mode:
```bash
cd claude-backend
npm install
npm run dev
```

## Project Structure

### Frontend
```
claude-frontend/
├── public/               # Static resources
├── src/
│   ├── assets/           # Images, CSS, etc.
│   ├── components/       # Vue components
│   ├── stores/           # Pinia stores
│   ├── utils/            # Utilities
│   ├── App.vue           # Root component
│   └── main.js           # Application entry point
```

### Backend
```
claude-backend/
├── src/
│   ├── config/           # Configuration
│   ├── controllers/      # API controllers
│   ├── models/           # Data models
│   ├── routes/           # API route definitions
│   ├── utils/            # Utilities
│   └── index.ts          # Application entry point
```

## API Endpoints

### Chats
- GET `/api/chats`: Get all chats
- POST `/api/chats`: Create a new chat
- GET `/api/chats/:id`: Get chat details
- DELETE `/api/chats/:id`: Delete a chat

### Models
- GET `/api/models`: Get list of AI models
- GET `/api/models/details/:id`: Get model details

## Docker

This application is containerized with Docker, consisting of 3 services:
- `frontend`: Vue.js application
- `backend`: NodeJS/Express API
- `db`: PostgreSQL database 