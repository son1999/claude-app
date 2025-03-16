#!/bin/bash

# Chạy Docker Compose cho backend
echo "Khởi động backend..."
cd claude-backend
docker-compose up -d
cd ..

# Chạy frontend
echo "Khởi động frontend..."
cd claude-clone
npm start 