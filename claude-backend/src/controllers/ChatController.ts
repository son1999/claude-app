import { Request, Response } from 'express';
import ChatService from '../services/ChatService';
import fs from 'fs';

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
      const { chatId } = req.params;
      const { content } = req.body;
      let { modelId, provider, fileIds } = req.body;

      // Log dữ liệu request để debug
      console.log('Request data:', { 
        params: req.params,
        body: req.body,
        chatId: chatId,
        modelId: modelId,
        provider: provider,
        hasFileIds: fileIds ? true : false,
        numFileIds: fileIds ? fileIds.length : 0,
        hasFile: req.file ? true : false
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
        provider = 'anthropic';
        console.log('Sử dụng model mặc định:', modelId);
      }

      // Kiểm tra xem có file đính kèm không
      const attachmentPath = req.file ? req.file.path : undefined;
      let updatedFileIds = fileIds || [];

      // Nếu có file đính kèm và provider là OpenAI, upload file lên OpenAI trước
      if (attachmentPath && provider === 'openai') {
        try {
          console.log(`Tự động tải file đính kèm lên OpenAI: ${attachmentPath}`);
          console.log(`Thông tin file: ${JSON.stringify(req.file, null, 2)}`);
          
          // Import trực tiếp để tránh vấn đề với require.cache
          const fileContent = fs.readFileSync(attachmentPath);
          console.log(`Đã đọc file, kích thước: ${fileContent.length} bytes`);
          
          const ModelService = require('../services/ModelService').default;
          console.log('ModelService loaded:', ModelService ? 'Yes' : 'No');
          
          const fileData = await ModelService.uploadFile(attachmentPath, 'openai');
          console.log('File đã tải lên OpenAI:', JSON.stringify(fileData, null, 2));
          
          // Thêm fileId mới vào danh sách
          if (fileData && fileData.id) {
            if (typeof updatedFileIds === 'string') {
              try {
                updatedFileIds = JSON.parse(updatedFileIds);
              } catch (e) {
                updatedFileIds = updatedFileIds ? [updatedFileIds] : [];
              }
            }
            
            if (!Array.isArray(updatedFileIds)) {
              updatedFileIds = [];
            }
            
            updatedFileIds.push(fileData.id);
            console.log(`Đã thêm fileId ${fileData.id} vào danh sách fileIds:`, updatedFileIds);
          } else {
            console.error('Không nhận được fileId từ OpenAI sau khi upload');
          }
        } catch (uploadError: any) {
          console.error('Lỗi khi tải file lên OpenAI:', uploadError);
          console.error('Thông tin chi tiết lỗi:', uploadError.stack);
          // Tiếp tục xử lý ngay cả khi không thể tải lên file
        }
      }

      // Kiểm tra và xử lý fileIds
      if (updatedFileIds && typeof updatedFileIds === 'string') {
        try {
          updatedFileIds = JSON.parse(updatedFileIds);
        } catch (e) {
          // Nếu không phải JSON, xem như là một ID đơn
          updatedFileIds = [updatedFileIds];
        }
      }

      console.log('FileIds cuối cùng được sử dụng:', updatedFileIds);

      const result = await ChatService.sendMessage(chatId, content, modelId, provider, attachmentPath, updatedFileIds);

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