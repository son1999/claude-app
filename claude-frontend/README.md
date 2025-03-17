# Claude Frontend

## Giới thiệu
Frontend cho ứng dụng Claude AI Chat, sử dụng Vue.js 3, Tailwind CSS, Pinia và Heroicons.

## Cài đặt và chạy

### Cài đặt dependencies
```bash
npm install
```

### Chạy môi trường development
```bash
npm run dev
```

### Build cho môi trường production
```bash
npm run build
```

### Preview phiên bản đã build
```bash
npm run preview
```

## Cấu hình môi trường

Ứng dụng sử dụng biến môi trường để cấu hình. Bạn có thể tạo các file sau để cấu hình cho các môi trường khác nhau:

- `.env`: Cấu hình mặc định, được sử dụng cho tất cả môi trường
- `.env.development`: Cấu hình cho môi trường phát triển (khi chạy `npm run dev`)
- `.env.production`: Cấu hình cho môi trường sản phẩm (khi chạy `npm run build`)

### Các biến môi trường 

| Biến | Mô tả | Giá trị mặc định |
|------|-------|-----------------|
| VITE_SERVER_HOST | Host máy chủ Vite | 0.0.0.0 |
| VITE_SERVER_PORT | Cổng máy chủ Vite | 5173 |
| VITE_API_BASE_URL | URL cơ sở của API backend | http://localhost:5000 |
| VITE_API_PREFIX | Tiền tố cho các API endpoint | /api |
| VITE_APP_TITLE | Tiêu đề ứng dụng | Claude AI Clone |
| VITE_APP_DESCRIPTION | Mô tả ứng dụng | Ứng dụng chat AI sử dụng Claude API |

## Cấu trúc dự án

- `src/`
  - `assets/`: Tài nguyên tĩnh (CSS, hình ảnh)
  - `components/`: Các component Vue
  - `router/`: Cấu hình Vue Router
  - `stores/`: Các Pinia store
  - `utils/`: Các tiện ích và helper
  - `views/`: Các trang của ứng dụng
  - `App.vue`: Component gốc
  - `main.js`: Điểm khởi đầu ứng dụng

## Sử dụng Docker

Để chạy ứng dụng với Docker:

```bash
docker build -t claude-frontend .
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules claude-frontend
```

Hoặc sử dụng docker-compose:

```bash
docker-compose up -d
``` 