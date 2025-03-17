# Hướng dẫn sử dụng Docker Compose cho Claude AI Clone

## Yêu cầu
- Docker và Docker Compose
- Anthropic API Key (đăng ký tại [Anthropic Console](https://console.anthropic.com/))

## Cách thiết lập và chạy

### 1. Thiết lập API Key

Có hai cách để thiết lập Anthropic API Key:

a. Sử dụng biến môi trường:
```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

b. Hoặc tạo file `.env` trong thư mục gốc:
```bash
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
```

### 2. Khởi động ứng dụng

#### Sử dụng script tự động:
```bash
chmod +x run-claude-clone.sh  # Cấp quyền thực thi nếu cần
./run-claude-clone.sh
```

#### Hoặc chạy trực tiếp:
```bash
docker-compose up -d
```

### 3. Truy cập ứng dụng
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)

### 4. Dừng ứng dụng
```bash
docker-compose down
```

## Cấu trúc Docker Compose

File `docker-compose.yml` bao gồm 3 dịch vụ:

1. **frontend**: Giao diện người dùng được xây dựng bằng Vue.js và Vite
   - Port: 3000
   - Biến môi trường: VITE_API_URL

2. **backend**: API được xây dựng bằng Node.js và Express
   - Port: 5000
   - Biến môi trường:
     - PORT
     - NODE_ENV
     - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
     - ANTHROPIC_API_KEY

3. **db**: PostgreSQL database
   - Port: 5432
   - Volumes: postgres_data (dữ liệu được lưu trữ kể cả khi container bị xóa)

## Xử lý lỗi phổ biến

### 1. Không thể kết nối đến frontend
- Kiểm tra backend đã khởi động thành công chưa
- Kiểm tra biến môi trường VITE_API_URL có chính xác không

### 2. Lỗi API key không hợp lệ
- Kiểm tra API key của Anthropic
- Đảm bảo API key đã được thiết lập đúng cách

### 3. Lỗi database
- Kiểm tra logs của dịch vụ db:
```bash
docker-compose logs db
```

### 4. Xem logs của các dịch vụ
```bash
# Xem logs của tất cả dịch vụ
docker-compose logs

# Xem logs của một dịch vụ cụ thể
docker-compose logs frontend
docker-compose logs backend
``` 