#!/bin/bash

# Script pre-commit để đảm bảo không commit thông tin nhạy cảm

# Kiểm tra các file .env
ENV_FILES=$(git diff --cached --name-only | grep "\.env$" || true)
if [ -n "$ENV_FILES" ]; then
  echo "CẢNH BÁO: Bạn đang cố gắng commit file .env:"
  echo "$ENV_FILES"
  echo "Các file này có thể chứa thông tin nhạy cảm như API key."
  echo "Hãy hủy bỏ và đảm bảo file .env đã được thêm vào .gitignore."
  echo "Để bỏ qua cảnh báo này (NẾU BẠN CHẮC CHẮN file không chứa thông tin nhạy cảm), sử dụng --no-verify"
  exit 1
fi

# Kiểm tra các file có chứa API key
FILES_WITH_API_KEYS=$(git diff --cached -G"sk-[a-zA-Z0-9-_]{30,}" --name-only || true)
if [ -n "$FILES_WITH_API_KEYS" ]; then
  echo "CẢNH BÁO: Các file sau có thể chứa API key:"
  echo "$FILES_WITH_API_KEYS"
  echo "Vui lòng kiểm tra lại và đảm bảo không commit thông tin nhạy cảm."
  echo "Để bỏ qua cảnh báo này (NẾU BẠN CHẮC CHẮN), sử dụng --no-verify"
  exit 1
fi

exit 0 