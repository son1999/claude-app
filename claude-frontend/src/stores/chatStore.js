import { defineStore } from "pinia";
import api from "../utils/api";
import { useModelStore } from "./modelStore";

export const useChatStore = defineStore("chat", {
  state: () => ({
    chats: [],
    currentChat: null,
    loading: false,
    error: null,
    maxMessagesInContext: 6, // Số tin nhắn tối đa giữ trong context
  }),

  getters: {
    getChats: (state) => state.chats,
    getCurrentChat: (state) => state.currentChat,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    
    // Lấy tin nhắn gần đây cho context
    getRecentMessages: (state) => {
      if (!state.currentChat || !state.currentChat.messages) return [];
      return state.currentChat.messages.slice(-state.maxMessagesInContext);
    },
    
    // Tạo tóm tắt context từ các tin nhắn cũ
    getContextSummary: (state) => {
      if (!state.currentChat || !state.currentChat.messages) return '';
      
      const oldMessages = state.currentChat.messages.slice(0, -state.maxMessagesInContext);
      if (oldMessages.length === 0) return '';
      
      // Tạo tóm tắt ngắn gọn từ các tin nhắn cũ
      const summary = oldMessages.reduce((acc, msg) => {
        const role = msg.is_user ? 'User' : 'Assistant';
        const shortContent = msg.content.length > 100 
          ? msg.content.substring(0, 100) + '...'
          : msg.content;
        return acc + `${role}: ${shortContent}\n`;
      }, '');
      
      return `Tóm tắt cuộc hội thoại trước đó:\n${summary}`;
    }
  },

  actions: {
    async fetchChats() {
      this.loading = true;
      try {
        const response = await api.get(`/chats`);
        console.log("API response from fetchChats:", response);

        // Đảm bảo response là một mảng
        if (!Array.isArray(response)) {
          console.error("Response không phải là mảng:", response);
          throw new Error("Dữ liệu chat không hợp lệ");
        }

        this.chats = response;
        console.log("Updated chats state:", this.chats);
        this.error = null;
      } catch (error) {
        this.error = error.message || "Lỗi khi tải danh sách chat";
        console.error("Error fetching chats:", error);
      } finally {
        this.loading = false;
      }
    },

    async fetchChatById(id) {
      this.loading = true;
      try {
        const response = await api.get(`/chats/${id}`);
        console.log("API response from fetchChatById:", response);

        // Đảm bảo response có id
        if (!response || !response.id) {
          console.error("Response không hợp lệ:", response);
          throw new Error("Dữ liệu chat không hợp lệ");
        }

        this.currentChat = response;
        console.log("Updated currentChat state:", this.currentChat);
        this.error = null;
        return this.currentChat;
      } catch (error) {
        this.error = error.message || "Lỗi khi tải thông tin chat";
        console.error("Error fetching chat:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async createChat() {
      this.loading = true;
      try {
        const response = await api.post(`/chats`, {
          title: "Cuộc trò chuyện mới",
        });

        console.log("API response from createChat:", response);

        // Đảm bảo response có id
        if (!response || !response.id) {
          console.error("Response không hợp lệ:", response);
          throw new Error("Dữ liệu chat mới không hợp lệ");
        }

        this.chats.unshift(response);
        this.currentChat = response;
        this.error = null;
        return response;
      } catch (error) {
        this.error = error.message || "Lỗi khi tạo chat mới";
        console.error("Error creating chat:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async sendMessage(chatId, content, attachment = null) {
      this.loading = true;
      try {
        const formData = new FormData();
        formData.append("content", content);

        // Lấy modelId từ modelStore
        const modelStore = useModelStore();
        const selectedModel = modelStore.getSelectedModel;
        
        // Thêm modelId vào formData
        if (selectedModel && selectedModel.id) {
          formData.append("modelId", selectedModel.id);
        } else {
          formData.append("modelId", "claude-3-sonnet-20240229");
        }

        // Thêm context tối ưu vào request
        const recentMessages = this.getRecentMessages;
        const contextSummary = this.getContextSummary;
        
        formData.append("conversationHistory", JSON.stringify(recentMessages));
        if (contextSummary) {
          formData.append("contextSummary", contextSummary);
        }

        if (attachment) {
          formData.append("attachment", attachment);
        }

        const response = await api.post(`/chats/${chatId}/messages`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("API response:", response);

        // Xử lý phản hồi từ API
        let messageData;
        
        // Kiểm tra cấu trúc phản hồi
        if (response && response.data) {
          messageData = response.data;
        } else if (response && response.success === true && response.data) {
          messageData = response.data;
        } else {
          messageData = response;
        }

        // Cập nhật currentChat với tin nhắn mới
        if (this.currentChat && this.currentChat.id === chatId) {
          if (!this.currentChat.messages) {
            this.currentChat.messages = [];
          }
          
          // Thêm tin nhắn người dùng vào danh sách nếu chưa có
          const userMessageExists = this.currentChat.messages.some(
            msg => (msg.is_user === true || msg.role === 'user') && 
                   msg.content === content && 
                   (msg.createdAt >= new Date().getTime() - 60000 || 
                    (msg.created_at && new Date(msg.created_at) >= new Date(Date.now() - 60000)))
          );
          
          if (!userMessageExists) {
            const userMessage = {
              id: Date.now().toString(),
              role: 'user',
              is_user: true, // Thêm trường is_user rõ ràng
              content: content,
              createdAt: new Date().toISOString(),
              chat_id: chatId
            };
            console.log("Adding user message:", userMessage);
            this.currentChat.messages.push(userMessage);
          }
          
          // Thêm tin nhắn phản hồi từ AI
          if (messageData) {
            // Đảm bảo AI message có trường is_user: false rõ ràng
            if (messageData.role !== 'user' && messageData.is_user === undefined) {
              messageData.is_user = false;
            }
            
            // Kiểm tra phản hồi đã tồn tại chưa để tránh trùng lặp
            const responseExists = this.currentChat.messages.some(
              msg => msg.id === messageData.id || 
                    (msg.role === 'assistant' && msg.createdAt === messageData.createdAt)
            );
            
            if (!responseExists) {
              console.log("Adding AI response:", messageData);
              this.currentChat.messages.push(messageData);
            }
          }
        }

        this.error = null;
        return messageData;
      } catch (error) {
        this.error = error.message || "Lỗi khi gửi tin nhắn";
        console.error("Error sending message:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async updateChatTitle(chatId, title) {
      try {
        // Cập nhật title ở frontend trước
        if (this.currentChat && this.currentChat.id === chatId) {
          this.currentChat.title = title;
        }
        
        // Tìm chat trong danh sách và cập nhật title
        const chatIndex = this.chats.findIndex(chat => chat.id === chatId);
        if (chatIndex !== -1) {
          this.chats[chatIndex].title = title;
        }
        
        // Gửi yêu cầu cập nhật lên server
        const response = await api.patch(`/chats/${chatId}`, {
          title: title
        });
        
        console.log("Updated chat title:", response);
        return response;
      } catch (error) {
        console.error("Error updating chat title:", error);
        // Không đặt this.error ở đây để tránh ảnh hưởng đến UI
      }
    },

    async deleteChat(id) {
      this.loading = true;
      try {
        await api.delete(`/chats/${id}`);
        this.chats = this.chats.filter((chat) => chat.id !== id);
        if (this.currentChat && this.currentChat.id === id) {
          this.currentChat = null;
        }
        this.error = null;
        return true;
      } catch (error) {
        this.error = error.message || "Lỗi khi xóa chat";
        console.error("Error deleting chat:", error);
        return false;
      } finally {
        this.loading = false;
      }
    },

    setCurrentChat(chat) {
      this.currentChat = chat;
    },

    clearError() {
      this.error = null;
    },

    // Thêm hàm điều chỉnh số lượng tin nhắn trong context
    setMaxMessagesInContext(count) {
      this.maxMessagesInContext = count;
    }
  },
});
