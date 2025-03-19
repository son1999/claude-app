import express from 'express';
import MessageController from '../controllers/MessageController';

// Khởi tạo router
const router = express.Router();

/**
 * PUT /messages/:id
 * Cập nhật nội dung tin nhắn và tạo phản hồi mới
 */
router.put('/messages/:id', MessageController.updateMessage);

export default router; 