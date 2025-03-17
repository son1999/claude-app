#!/bin/bash

# Màu sắc cho output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Đang dừng ứng dụng Claude AI Clone...${NC}"

# Dừng và xóa các container
docker-compose down

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Ứng dụng đã được dừng thành công!${NC}"
else
  echo -e "${RED}Có lỗi xảy ra khi dừng ứng dụng.${NC}"
  exit 1
fi

echo -e "${YELLOW}Để khởi động lại ứng dụng, hãy chạy lệnh: ./run.sh${NC}" 