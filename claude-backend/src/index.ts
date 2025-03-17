import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from './config/database';
import { syncDatabase } from './models';
import routes from './routes';

// Cấu hình biến môi trường
dotenv.config();

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Phục vụ các file tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', routes);

// Route mặc định
app.get('/', (req, res) => {
  res.json({
    message: 'Claude API Server',
    status: 'running'
  });
});

// Khởi động server
const startServer = async () => {
  try {
    // Kết nối đến cơ sở dữ liệu
    await connectDatabase();
    
    // Đồng bộ hóa các models với cơ sở dữ liệu
    await syncDatabase();
    
    // Khởi động server - lắng nghe trên tất cả network interface
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server đang chạy tại http://0.0.0.0:${PORT}`);
      console.log('Server có thể truy cập từ tất cả network interfaces');
    });
  } catch (error) {
    console.error('Không thể khởi động server:', error);
    process.exit(1);
  }
};

startServer(); 