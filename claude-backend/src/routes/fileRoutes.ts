import express, { Request, Response, RequestHandler } from 'express';
import FileController from '../controllers/FileController';
import { upload } from '../utils/fileUpload';

const router = express.Router();

// Upload file
router.post(
  '/upload',
  upload.single('file'),
  ((req: Request, res: Response) => {
    try {
      // Đảm bảo provider được chuyển đến middleware
      if (req.body && req.body.provider) {
        // Thêm provider vào header để middleware fileUpload có thể truy cập
        req.headers['x-provider'] = req.body.provider as string;
      }

      return FileController.uploadFile(req, res);
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Có lỗi xảy ra khi tải lên file.' });
    }
  }) as RequestHandler
);

// Lấy danh sách file đã upload
router.get('/', FileController.listFiles as RequestHandler);

// Lấy thông tin file theo ID
router.get('/:fileId', FileController.getFile as RequestHandler);

// Xóa file theo ID
router.delete('/:fileId', FileController.deleteFile as RequestHandler);

export default router; 