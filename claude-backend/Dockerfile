FROM node:18-alpine

WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Cài đặt nodemon và ts-node
RUN npm install -g nodemon ts-node

# Tạo thư mục uploads
RUN mkdir -p uploads

# KHÔNG copy .env file vì nó chứa thông tin nhạy cảm
# COPY .env ./

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "run", "dev"] 