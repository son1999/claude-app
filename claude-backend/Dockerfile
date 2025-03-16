FROM node:18-alpine

WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép mã nguồn
COPY . .

# Biên dịch TypeScript
RUN npm run build

# Tạo thư mục uploads
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Khởi động ứng dụng
CMD ["npm", "start"] 