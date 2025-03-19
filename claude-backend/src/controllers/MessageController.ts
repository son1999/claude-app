import { Request, Response, RequestHandler } from 'express';
import ChatService from '../services/ChatService';

class MessageController {
  /**
   * Cập nhật nội dung tin nhắn và tạo phản hồi mới
   */
  updateMessage: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const { content, conversationId, aiMessageId, modelId, provider } = req.body;
      
      console.log(`Đang cập nhật tin nhắn: ${id} với nội dung: ${content}, model: ${modelId}, provider: ${provider}`);
      
      // Nếu không có aiMessageId, chỉ cập nhật tin nhắn người dùng
      if (!aiMessageId) {
        // Tìm và cập nhật tin nhắn
        await ChatService.editMessage(id, content, null, modelId, provider);
        res.status(200).json({ success: true });
        return;
      }
      
      // Sử dụng ChatService để xử lý việc chỉnh sửa tin nhắn
      const result = await ChatService.editMessage(id, content, aiMessageId, modelId, provider);
      
      // Trả về kết quả
      res.status(200).json({
        success: true,
        aiMessage: {
          id: aiMessageId,
          content: result.aiContent
        }
      });
    } catch (error) {
      console.error('Error updating message:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể cập nhật tin nhắn: ' + (error instanceof Error ? error.message : String(error))
      });
    }
  }
}

export default new MessageController(); 