#!/bin/bash

echo "Tạm dừng các container hiện tại..."
docker-compose stop

echo "Xây dựng lại các container với cấu hình mới..."
docker-compose up -d --build

echo "Dự án đã được khởi động với hot-reloading!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:5000"
echo ""
echo "Các thay đổi code sẽ được tự động cập nhật mà không cần khởi động lại Docker."
echo "Chú ý: Nếu bạn thay đổi cấu hình Docker, dependencies hoặc các file Dockerfile, bạn vẫn cần chạy lại script này." 