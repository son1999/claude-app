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

      // Lưu tin nhắn của người dùng
      const userMessage = await Message.create({
        chat_id: chatId,
        content,
        is_user: true,
        attachment_url: attachmentPath ? `/uploads/${attachmentPath.split('/').pop()}` : undefined
      });

      // Chuẩn bị lịch sử hội thoại để gửi đến Claude API
      const conversationHistory = [];
      
      // Lấy context_summary từ chat nếu có
      const contextSummary = chat.context_summary;
      
      // Chuyển đổi tin nhắn cũ thành định dạng phù hợp cho API
      if (chat.messages && chat.messages.length > 0) {
        // Chỉ gửi tối đa 10 tin nhắn gần nhất để tối ưu token
        const recentMessages = chat.messages.slice(-10);
        
        for (const msg of recentMessages) {
          // Đảm bảo chỉ lấy tin nhắn trước tin nhắn hiện tại
          if (msg.id === userMessage.id) continue;
          
          conversationHistory.push({
            role: msg.is_user ? 'user' : 'assistant',
            content: msg.content
          });
        }
      }
      
      // Gửi tin nhắn đến Claude và nhận phản hồi
      const response = await AnthropicService.sendMessage(
        content, 
        modelId, 
        attachmentPath, 
        conversationHistory, 
        contextSummary
      );

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
      
      // Cập nhật context_summary sau mỗi 10 tin nhắn
      if (messageCount % 10 === 0 && messageCount > 10) {
        try {
          // Lấy tất cả tin nhắn
          const allMessages = await Message.findAll({
            where: { chat_id: chatId },
            order: [['created_at', 'ASC']]
          });
          
          // Chuyển đổi thành định dạng lịch sử hội thoại
          const historyForSummary = allMessages.map(msg => ({
            role: msg.is_user ? 'user' : 'assistant',
            content: msg.content
          }));
          
          // Gửi yêu cầu tóm tắt đến Claude
          const summaryPrompt = "Hãy tóm tắt ngắn gọn các thông tin quan trọng từ cuộc hội thoại sau để làm ngữ cảnh cho các cuộc trò chuyện tiếp theo. Tóm tắt không quá 200 từ.";
          
          const summarizationResponse = await AnthropicService.sendMessage(
            summaryPrompt,
            modelId,
            undefined,
            historyForSummary
          );
          
          // Cập nhật context_summary cho chat
          await chat.update({
            context_summary: summarizationResponse.content
          });
          
          console.log('Đã cập nhật tóm tắt context cho chat:', chatId);
        } catch (summaryError) {
          console.error('Lỗi khi tạo tóm tắt context:', summaryError);
          // Tiếp tục xử lý bình thường ngay cả khi không thể tạo tóm tắt
        }
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