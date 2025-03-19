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
  
  // Lấy provider từ headers hoặc query parameters (vì multer xử lý trước khi body được parse)
  const provider = 
    (req.headers && req.headers['x-provider']) || 
    (req.query && req.query.provider) || 
    'anthropic';
  
  // Chuyển provider về string
  const providerStr = Array.isArray(provider) ? provider[0] : provider.toString();
  
  console.log(`Provider được xác định: ${providerStr}`);
  
  // Danh sách định dạng file được hỗ trợ, chia theo nhà cung cấp
  const allowedTypes: { [key: string]: string[] } = {
    // Anthropic chỉ hỗ trợ hình ảnh và PDF
    anthropic: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ],
    // OpenAI hỗ trợ nhiều định dạng hơn
    openai: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      // Microsoft Office
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      // OpenDocument
      'application/vnd.oasis.opendocument.text', // .odt
      'application/vnd.oasis.opendocument.spreadsheet', // .ods
      'application/vnd.oasis.opendocument.presentation', // .odp
      // Text
      'text/plain', // .txt
      'text/csv', // .csv
      'text/html', // .html
      'text/markdown', // .md
      // Code
      'application/json', // .json
      'text/javascript', // .js
      'application/xml', // .xml
    ]
  };
  
  // Kiểm tra xem file có được hỗ trợ cho provider đã chọn không
  const supportedTypes = allowedTypes[providerStr] || allowedTypes['anthropic']; // Default to Anthropic
  
  if (supportedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Nếu file không được hỗ trợ bởi provider đã chọn, thông báo rõ ràng hơn
    console.error(`Từ chối file không hỗ trợ bởi ${providerStr}: ${file.mimetype}`);
    
    // Danh sách MIME type được hỗ trợ dưới dạng văn bản
    const supportedFormats = providerStr === 'openai' 
      ? 'JPEG, PNG, GIF, WebP, PDF, Word, Excel, PowerPoint, OpenDocument, Text, và các định dạng khác'
      : 'JPEG, PNG, GIF, WebP và PDF';
    
    cb(new Error(`Định dạng file ${file.mimetype} không được hỗ trợ bởi ${providerStr}. Provider này chỉ chấp nhận ${supportedFormats}.`));
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