import { Chat, Message } from '../models';
import AnthropicService from './AnthropicService';

class ChatService {
  /**
   * Tạo chat mới
   */
  async createChat(title: string) {
    try {
      const chat = await Chat.create({ title });

      // Tạo tin nhắn chào mừng từ AI
      await Message.create({
        chat_id: chat.id,
        content: 'Xin chào! Tôi là Claude. Tôi có thể giúp gì cho bạn hôm nay?',
        is_user: false
      });

      // Lấy lại chat với messages để đảm bảo dữ liệu đầy đủ
      const fullChat = await Chat.findByPk(chat.id, {
        include: [{
          model: Message,
          as: 'messages'
        }]
      });

      if (!fullChat) {
        throw new Error('Không thể lấy thông tin chat sau khi tạo');
      }

      console.log('Created chat with data:', {
        id: fullChat.id,
        title: fullChat.title,
        hasMessages: fullChat.messages ? fullChat.messages.length > 0 : false
      });

      return fullChat;
    } catch (error) {
      console.error('Lỗi khi tạo chat mới:', error);
      throw new Error('Không thể tạo chat mới');
    }
  }

  /**
   * Lấy danh sách chat
   */
  async getChats() {
    try {
      const chats = await Chat.findAll({
        order: [['created_at', 'DESC']]
      });
      return chats;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách chat:', error);
      throw new Error('Không thể lấy danh sách chat');
    }
  }

  /**
   * Lấy thông tin chi tiết của một chat
   */
  async getChatById(chatId: string) {
    try {
      const chat = await Chat.findByPk(chatId, {
        include: [{
          model: Message,
          as: 'messages',
          order: [['created_at', 'ASC']]
        }]
      });

      if (!chat) {
        throw new Error('Chat không tồn tại');
      }

      return chat;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Gửi tin nhắn trong một chat
   */
  async sendMessage(chatId: string, content: string, modelId: string, attachmentPath?: string) {
    try {
      // Kiểm tra xem chat có tồn tại không
      const chat = await Chat.findByPk(chatId);
      if (!chat) {
        throw new Error('Chat không tồn tại');
      }

      // Lưu tin nhắn của người dùng
      const userMessage = await Message.create({
        chat_id: chatId,
        content,
        is_user: true,
        attachment_url: attachmentPath ? `/uploads/${attachmentPath.split('/').pop()}` : undefined
      });

      // Gửi tin nhắn đến Claude và nhận phản hồi
      const response = await AnthropicService.sendMessage(content, modelId, attachmentPath);

      // Lưu phản hồi từ AI
      const aiMessage = await Message.create({
        chat_id: chatId,
        content: response.content,
        is_user: false
      });

      // Cập nhật tiêu đề chat nếu là tin nhắn đầu tiên
      const messageCount = await Message.count({ where: { chat_id: chatId } });
      if (messageCount <= 3) { // Bao gồm tin nhắn chào mừng, tin nhắn người dùng và phản hồi AI
        await chat.update({
          title: content.length > 30 ? content.substring(0, 30) + '...' : content
        });
      }

      return {
        userMessage,
        aiMessage,
        response
      };
    } catch (error) {
      console.error(`Lỗi khi gửi tin nhắn trong chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Xóa một chat
   */
  async deleteChat(chatId: string) {
    try {
      const chat = await Chat.findByPk(chatId);
      if (!chat) {
        throw new Error('Chat không tồn tại');
      }

      // Xóa tất cả tin nhắn trong chat
      await Message.destroy({ where: { chat_id: chatId } });

      // Xóa chat
      await chat.destroy();

      return { success: true, message: 'Đã xóa chat thành công' };
    } catch (error) {
      console.error(`Lỗi khi xóa chat ${chatId}:`, error);
      throw error;
    }
  }
}

export default new ChatService(); 