import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Đã tạo thư mục uploads tại: ${uploadDir}`);
} else {
  console.log(`Thư mục uploads đã tồn tại tại: ${uploadDir}`);
}

// Kiểm tra quyền ghi
try {
  const testFile = path.join(uploadDir, '.test_write_permission');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('Thư mục uploads có quyền ghi');
} catch (error) {
  console.error('CẢNH BÁO: Thư mục uploads không có quyền ghi!', error);
}

// Cấu hình storage cho multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Log để debug
    console.log(`Lưu file vào: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất với timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    
    // Log để debug
    console.log(`Tên file sau khi lưu: ${filename}`);
    cb(null, filename);
  }
});

// Lọc các loại file được chấp nhận
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Log để debug
  console.log(`Kiểm tra file: ${file.originalname}, MIME: ${file.mimetype}`);
  
  // Chấp nhận các định dạng file phổ biến
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error(`Từ chối file không hỗ trợ: ${file.mimetype}`);
    cb(new Error(`Định dạng file ${file.mimetype} không được hỗ trợ. Chỉ chấp nhận JPEG, PNG, GIF, WebP và PDF.`));
  }
};

// Tạo instance multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // Giới hạn kích thước file: 25MB
  }
}); 