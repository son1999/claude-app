import express, { Request, Response, RequestHandler } from 'express';
import ChatController from '../controllers/ChatController';
import { upload } from '../utils/fileUpload';

const router = express.Router();

// Lấy danh sách tất cả chat
router.get('/', ChatController.getChats as RequestHandler);

// Tạo một chat mới
router.post('/', ChatController.createChat as RequestHandler);

// Lấy một chat cụ thể theo ID
router.get('/:id', ChatController.getChatById as RequestHandler);

// Nhắn tin vào một cuộc hội thoại
router.post(
  '/:chatId/messages',
  upload.single('attachment'),
  ((req: Request, res: Response) => {
    try {
      if (req.body && req.body.provider) {
        req.headers['x-provider'] = req.body.provider as string;
      }
      
      return ChatController.sendMessage(req, res);
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ error: 'Có lỗi xảy ra khi gửi tin nhắn.' });
    }
  }) as RequestHandler
);

// Xóa một chat
router.delete('/:id', ChatController.deleteChat as RequestHandler);

export default router; 