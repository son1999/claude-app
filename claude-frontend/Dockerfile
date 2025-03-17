FROM node:18-alpine

WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép mã nguồn
COPY . .

# Expose port
EXPOSE 5173

# Khởi động ứng dụng trong chế độ dev
CMD ["npm", "run", "dev", "--", "--host"] 