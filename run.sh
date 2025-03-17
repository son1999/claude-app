#!/bin/bash

# Màu sắc cho output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Kiểm tra file .env...${NC}"

# Kiểm tra file .env của backend
if [ ! -f "./claude-backend/.env" ]; then
  echo -e "${YELLOW}File .env của backend không tồn tại. Đang tạo từ file mẫu...${NC}"
  if [ -f "./claude-backend/.env.example" ]; then
    cp ./claude-backend/.env.example ./claude-backend/.env
    echo -e "${GREEN}Đã tạo file .env từ file mẫu. Vui lòng chỉnh sửa để thêm API key thực.${NC}"
    echo -e "${RED}QUAN TRỌNG: Bạn cần phải thêm ANTHROPIC_API_KEY vào file ./claude-backend/.env trước khi tiếp tục!${NC}"
    echo -e "Nhấn Enter để mở file để chỉnh sửa, hoặc Ctrl+C để hủy."
    read
    ${EDITOR:-vi} ./claude-backend/.env
  else
    echo -e "${RED}Không tìm thấy file .env.example. Vui lòng tạo file .env thủ công.${NC}"
    exit 1
  fi
fi

# Kiểm tra ANTHROPIC_API_KEY
if grep -q "ANTHROPIC_API_KEY=your_anthropic_api_key_here" "./claude-backend/.env"; then
  echo -e "${RED}ANTHROPIC_API_KEY chưa được cấu hình. Vui lòng chỉnh sửa file .env.${NC}"
  echo -e "Nhấn Enter để mở file để chỉnh sửa, hoặc Ctrl+C để hủy."
  read
  ${EDITOR:-vi} ./claude-backend/.env
fi

# Lấy ANTHROPIC_API_KEY từ file .env
ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY ./claude-backend/.env | cut -d '=' -f2)
echo "Đã lấy ANTHROPIC_API_KEY từ file .env của backend"

# Dừng và xóa container cũ nếu có
echo "Dừng và xóa container cũ nếu có..."
docker-compose down

# Khởi động ứng dụng
echo "Khởi động Claude AI Clone..."
docker-compose up -d

# Kiểm tra trạng thái
echo "Ứng dụng đã được khởi động:"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:5000"

# Khởi động lại container frontend để đảm bảo nó có thể kết nối với backend
sleep 5
docker-compose restart frontend 