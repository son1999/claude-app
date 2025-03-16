import { Request, Response } from 'express';
import ChatService from '../services/ChatService';

class ChatController {
  /**
   * Tạo chat mới
   */
  async createChat(req: Request, res: Response) {
    try {
      const { title } = req.body;
      
      const chat = await ChatService.createChat(title);
      
      res.status(201).json({
        success: true,
        data: chat
      });
    } catch (error: any) {
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
      const { content, modelId } = req.body;
      
      if (!content) {
        res.status(400).json({
          success: false,
          message: 'Nội dung tin nhắn không được để trống'
        });
        return;
      }
      
      // Kiểm tra xem có file đính kèm không
      const attachmentPath = req.file ? req.file.path : undefined;
      
      const result = await ChatService.sendMessage(id, content, modelId, attachmentPath);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
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