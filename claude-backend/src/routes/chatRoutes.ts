import express from 'express';
import ChatController from '../controllers/ChatController';
import { upload } from '../utils/fileUpload';

const router = express.Router();

// Lấy danh sách chat
router.get('/', ChatController.getChats);

// Tạo chat mới
router.post('/', ChatController.createChat);

// Lấy thông tin chi tiết của một chat
router.get('/:id', ChatController.getChatById);

// Gửi tin nhắn trong một chat (với hỗ trợ đính kèm file)
router.post('/:id/messages', upload.single('attachment'), ChatController.sendMessage);

// Xóa một chat
router.delete('/:id', ChatController.deleteChat);

export default router; 