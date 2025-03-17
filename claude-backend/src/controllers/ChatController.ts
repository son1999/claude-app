import { Request, Response } from 'express';
import ChatService from '../services/ChatService';

class ChatController {
  /**
   * Tạo chat mới
   */
  async createChat(req: Request, res: Response) {
    try {
      const { title = "Cuộc trò chuyện mới" } = req.body;

      const chat = await ChatService.createChat(title);

      // Log chi tiết kết quả để debug
      console.log('Tạo chat mới thành công:', {
        chat_id: chat.id,
        title: chat.title,
        created_at: chat.created_at
      });

      res.status(201).json({
        success: true,
        data: chat
      });
    } catch (error: any) {
      console.error('Lỗi khi tạo chat mới:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi tạo chat mới'
      });
    }
  }

  /**
   * Lấy danh sách chat
   */
  async getChats(req: Request, res: Response) {
    try {
      const chats = await ChatService.getChats();

      res.status(200).json({
        success: true,
        data: chats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi lấy danh sách chat'
      });
    }
  }

  /**
   * Lấy thông tin chi tiết của một chat
   */
  async getChatById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const chat = await ChatService.getChatById(id);

      res.status(200).json({
        success: true,
        data: chat
      });
    } catch (error: any) {
      res.status(error.message === 'Chat không tồn tại' ? 404 : 500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi lấy thông tin chat'
      });
    }
  }

  /**
   * Gửi tin nhắn trong một chat
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      let { modelId } = req.body;

      // Log dữ liệu request để debug
      console.log('Request data:', { 
        params: req.params,
        body: req.body,
        modelId: modelId
      });

      if (!content) {
        res.status(400).json({
          success: false,
          message: 'Nội dung tin nhắn không được để trống'
        });
        return;
      }

      // Đảm bảo có modelId, nếu không có thì dùng giá trị mặc định
      if (!modelId) {
        modelId = 'claude-3-sonnet-20240229'; // Fallback model mặc định
        console.log('Sử dụng model mặc định:', modelId);
      }

      // Kiểm tra xem có file đính kèm không
      const attachmentPath = req.file ? req.file.path : undefined;

      const result = await ChatService.sendMessage(id, content, modelId, attachmentPath);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Lỗi khi xử lý tin nhắn:', error);
      res.status(error.message === 'Chat không tồn tại' ? 404 : 500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi gửi tin nhắn'
      });
    }
  }

  /**
   * Xóa một chat
   */
  async deleteChat(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await ChatService.deleteChat(id);

      res.status(200).json({
        success: true,
        message: 'Đã xóa chat thành công'
      });
    } catch (error: any) {
      res.status(error.message === 'Chat không tồn tại' ? 404 : 500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi xóa chat'
      });
    }
  }
}

export default new ChatController(); 