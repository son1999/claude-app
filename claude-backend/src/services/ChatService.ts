import { Chat, Message } from '../models';
import AnthropicService from './AnthropicService';
import ModelService from './ModelService';

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
  async sendMessage(chatId: string, content: string, modelId: string, provider?: string, attachmentPath?: string, fileIds?: string[]) {
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
        model_id: modelId,
        provider: provider,
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
      
      // Gửi tin nhắn đến model API và nhận phản hồi
      const response = await ModelService.sendMessage(
        content, 
        modelId,
        provider,  
        attachmentPath, 
        conversationHistory, 
        contextSummary,
        fileIds
      );

      // Lưu phản hồi từ AI
      const aiMessage = await Message.create({
        chat_id: chatId,
        content: response.content,
        is_user: false,
        model_id: modelId,
        provider: provider
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
          
          // Gửi yêu cầu tóm tắt đến model
          const summaryPrompt = "Hãy tóm tắt ngắn gọn các thông tin quan trọng từ cuộc hội thoại sau để làm ngữ cảnh cho các cuộc trò chuyện tiếp theo. Tóm tắt không quá 200 từ.";
          
          const summarizationResponse = await ModelService.sendMessage(
            summaryPrompt,
            modelId,
            provider,
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
      
      // Xóa tất cả tin nhắn trong chat trước
      await Message.destroy({
        where: { chat_id: chatId }
      });
      
      // Sau đó xóa chat
      await chat.destroy();
      
      return true;
    } catch (error) {
      console.error(`Lỗi khi xóa chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Chỉnh sửa tin nhắn trong một chat
   * @param messageId ID của tin nhắn cần chỉnh sửa
   * @param newContent Nội dung mới của tin nhắn
   * @param aiMessageId ID của tin nhắn AI cần cập nhật phản hồi hoặc null/undefined
   * @param modelId ID của model AI được sử dụng
   * @param provider Nhà cung cấp AI (anthropic hoặc openai)
   */
  async editMessage(messageId: string, newContent: string, aiMessageId: string | null | undefined, modelId: string, provider?: string) {
    try {
      // Tìm tin nhắn cần chỉnh sửa
      const message = await Message.findByPk(messageId);
      if (!message) {
        throw new Error('Tin nhắn không tồn tại');
      }

      // Cập nhật nội dung tin nhắn
      await message.update({ content: newContent });

      // Nếu không có aiMessageId, chỉ cập nhật tin nhắn người dùng và trả về
      if (!aiMessageId) {
        return {
          userMessage: message,
          aiMessage: null,
          aiContent: null
        };
      }

      // Tìm chat chứa tin nhắn này
      const chat = await Chat.findByPk(message.chat_id, {
        include: [{
          model: Message,
          as: 'messages',
          order: [['created_at', 'ASC']]
        }]
      });

      if (!chat) {
        throw new Error('Chat không tồn tại');
      }

      // Tìm vị trí của tin nhắn hiện tại
      const allMessages = chat.messages || [];
      const currentMessageIndex = allMessages.findIndex(msg => msg.id === messageId);
      
      if (currentMessageIndex === -1) {
        throw new Error('Không tìm thấy tin nhắn trong hội thoại');
      }

      // Tính toán vị trí bắt đầu để lấy 6 câu hỏi trước đó
      const startIndex = Math.max(0, currentMessageIndex - 12); // 6 cặp user-AI messages
      
      // Lấy 6 câu hỏi trước đó và tin nhắn hiện tại
      const contextMessages = allMessages.slice(startIndex, currentMessageIndex);
      
      // Chuẩn bị lịch sử hội thoại cho API
      const conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
      
      // Định dạng lịch sử cuộc trò chuyện cho API
      contextMessages.forEach(msg => {
        conversationHistory.push({
          role: msg.is_user ? "user" as const : "assistant" as const,
          content: msg.content
        });
      });

      // Gửi tin nhắn đến AI và nhận phản hồi
      const response = await ModelService.sendMessage(
        newContent, 
        modelId,
        provider,
        undefined, // không có attachment khi chỉnh sửa
        conversationHistory
      );

      // Tìm và cập nhật tin nhắn AI
      if (aiMessageId) {
        const aiMessage = await Message.findByPk(aiMessageId);
        if (aiMessage) {
          await aiMessage.update({ 
            content: response.content,
            model_id: modelId,
            provider: provider
          });
        }
      }

      // Trả về cả tin nhắn người dùng đã cập nhật và phản hồi AI
      return {
        userMessage: await Message.findByPk(messageId),
        aiMessage: aiMessageId ? await Message.findByPk(aiMessageId) : null,
        aiContent: response.content
      };
    } catch (error) {
      console.error(`Lỗi khi chỉnh sửa tin nhắn ${messageId}:`, error);
      throw error;
    }
  }
}

export default new ChatService(); 