#!/bin/bash

# Màu sắc cho output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Kiểm tra trạng thái ứng dụng Claude AI Clone${NC}"
echo "----------------------------------------"

# Kiểm tra các container đang chạy
echo -e "${YELLOW}Kiểm tra các container:${NC}"
CONTAINERS=$(docker ps --format "{{.Names}}" | grep claude-app)

if [ -z "$CONTAINERS" ]; then
  echo -e "${RED}Không tìm thấy container nào đang chạy!${NC}"
  echo "Vui lòng khởi động ứng dụng bằng lệnh: ./run.sh"
  exit 1
fi

echo -e "${GREEN}Các container đang chạy:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep claude-app

echo "----------------------------------------"

# Kiểm tra endpoint backend
echo -e "${YELLOW}Kiểm tra backend API:${NC}"
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/)

if [ "$BACKEND_RESPONSE" == "200" ]; then
  echo -e "${GREEN}Backend API đang hoạt động (HTTP 200)${NC}"
  
  # Kiểm tra các endpoint API chính
  echo -e "${YELLOW}Kiểm tra các endpoint API:${NC}"
  
  # Kiểm tra /api/models
  MODELS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/models)
  if [ "$MODELS_RESPONSE" == "200" ]; then
    echo -e "${GREEN}- Endpoint /api/models: OK${NC}"
  else
    echo -e "${RED}- Endpoint /api/models: Lỗi (HTTP $MODELS_RESPONSE)${NC}"
  fi
  
  # Kiểm tra /api/chats
  CHATS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/chats)
  if [ "$CHATS_RESPONSE" == "200" ]; then
    echo -e "${GREEN}- Endpoint /api/chats: OK${NC}"
  else
    echo -e "${RED}- Endpoint /api/chats: Lỗi (HTTP $CHATS_RESPONSE)${NC}"
  fi
  
else
  echo -e "${RED}Backend API không hoạt động (HTTP $BACKEND_RESPONSE)${NC}"
fi

echo "----------------------------------------"

# Kiểm tra frontend
echo -e "${YELLOW}Kiểm tra frontend:${NC}"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/)

if [ "$FRONTEND_RESPONSE" == "200" ]; then
  echo -e "${GREEN}Frontend đang hoạt động (HTTP 200)${NC}"
else
  echo -e "${RED}Frontend không hoạt động (HTTP $FRONTEND_RESPONSE)${NC}"
fi

echo "----------------------------------------"
echo -e "${YELLOW}Thông tin logs:${NC}"
echo "- Xem logs frontend: docker logs claude-app-frontend-1"
echo "- Xem logs backend: docker logs claude-app-backend-1"
echo "- Xem logs database: docker logs claude-app-db-1"
echo "----------------------------------------"

echo -e "${YELLOW}URLs:${NC}"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:5000"
echo "----------------------------------------" 