<template>
  <div class="flex h-screen">
    <ChatSidebar />
    
    <div class="flex-1 flex flex-col h-screen overflow-hidden">
      <!-- Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-between">
        <div class="flex items-center">
          <h2 class="text-lg font-medium truncate">
            {{ chatTitle }}
          </h2>
        </div>
        
        <div class="flex items-center space-x-2">
          <div class="relative">
            <button 
              @click="toggleModelDropdown($event)"
              data-dropdown-toggle
              class="flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span v-if="currentModel" class="flex items-center">
                <span class="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                <span>{{ currentModel.name }}</span>
              </span>
              <span v-else>Chọn model</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div 
              v-if="showModelDropdown" 
              data-dropdown-menu
              class="absolute right-0 mt-1 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10"
              @click.stop
            >
              <div class="py-2" role="menu" aria-orientation="vertical">
                <h3 class="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Models khả dụng</h3>
                
                <div v-if="isModelLoading" class="px-4 py-2 text-sm text-gray-500 flex items-center">
                  <div class="mr-2 h-4 w-4 rounded-full border-2 border-t-transparent border-primary animate-spin"></div>
                  Đang tải models...
                </div>
                
                <div v-else-if="availableModels.length === 0" class="px-4 py-2 text-sm text-gray-500">
                  Không có model nào
                </div>
                
                <template v-else>
                  <button
                    v-for="model in availableModels"
                    :key="model.id"
                    @click="selectModelAndClose(model)"
                    class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                    :class="{ 'bg-primary/10': currentModel?.id === model.id }"
                    role="menuitem"
                  >
                    <div class="flex items-center">
                      <span 
                        class="w-2 h-2 rounded-full mr-2"
                        :class="currentModel?.id === model.id ? 'bg-green-500' : 'bg-gray-400'"
                      ></span>
                      <div class="font-medium" :class="{ 'text-primary': currentModel?.id === model.id }">
                        {{ model.name }}
                      </div>
                    </div>
                    <div class="text-xs text-gray-500 mt-0.5 ml-4">{{ model.description || 'Không có mô tả' }}</div>
                  </button>
                </template>
              </div>
            </div>
          </div>
          
          <!-- Nút chuyển đổi theme -->
          <button 
            @click="themeStore.toggleDarkMode"
            class="p-2 text-gray-500 hover:text-primary rounded-full"
            title="Đổi giao diện sáng/tối"
          >
            <svg v-if="themeStore.isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          
          <button 
            @click="toggleModelPanel"
            class="p-2 text-gray-500 hover:text-primary rounded-full"
            :class="{ 'text-primary': showModelPanel }"
          >
            <Cog6ToothIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div class="flex flex-1 overflow-hidden">
        <!-- Message area -->
        <div class="flex-1 flex flex-col h-full">
          <MessageList 
            :messages="messages" 
            :loading="isLoading" 
            :is-typing="isTyping"
            @use-suggestion="handleSuggestion"
            @edit-message="editMessage"
            class="bg-gray-100 dark:bg-gray-900"
          />
          
          <MessageInput 
            :chat-id="chatId" 
            :sending="isSending"
            @send="sendMessage"
          />
        </div>
        
        <!-- Model panel (optional) -->
        <transition name="slide">
          <ModelSelector v-if="showModelPanel" />
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChatStore } from '../stores/chatStore';
import { useModelStore } from '../stores/modelStore';
import { useThemeStore } from '../stores/themeStore';
import ChatSidebar from '../components/ChatSidebar.vue';
import MessageList from '../components/MessageList.vue';
import MessageInput from '../components/MessageInput.vue';
import ModelSelector from '../components/ModelSelector.vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();
const modelStore = useModelStore();
const themeStore = useThemeStore();

// State
const showModelPanel = ref(false);
const showModelDropdown = ref(false);
const isTyping = ref(false);
const isSending = ref(false);

// Computed
const chatId = computed(() => route.params.id);
const currentChat = computed(() => chatStore.getCurrentChat);
const messages = computed(() => currentChat.value?.messages || []);
const isLoading = computed(() => chatStore.isLoading);
const currentModel = computed(() => modelStore.getSelectedModel);
const availableModels = computed(() => {
  const models = modelStore.getModels;
  console.log('Available models:', models);
  return Array.isArray(models) ? models : [];
});
const isModelLoading = computed(() => {
  // Chỉ hiển thị loading khi đang tải và chưa có models
  return modelStore.isLoading && (!modelStore.models || modelStore.models.length === 0);
});

const chatTitle = computed(() => {
  if (!currentChat.value) return 'Cuộc trò chuyện mới';
  
  if (currentChat.value.title) return currentChat.value.title;
  
  if (messages.value.length > 0) {
    const firstMsg = messages.value[0].content;
    return firstMsg.substring(0, 30) + (firstMsg.length > 30 ? '...' : '');
  }
  
  return 'Cuộc trò chuyện mới';
});

// Methods
const toggleModelDropdown = (event) => {
  // Ngăn chặn sự kiện lan truyền lên (ngăn click outside handler)
  if (event) {
    event.stopPropagation();
  }
  showModelDropdown.value = !showModelDropdown.value;
};

const selectModelAndClose = (model) => {
  modelStore.setSelectedModel(model);
  showModelDropdown.value = false;
};

const toggleModelPanel = () => {
  showModelPanel.value = !showModelPanel.value;
};

const handleSuggestion = (suggestion) => {
  sendMessage({ content: suggestion });
};

const sendMessage = async ({ content, attachment }) => {
  if (!chatId.value) return;
  
  // Đặt trạng thái gửi tin nhắn
  isSending.value = true;
  isTyping.value = true;
  
  try {
    // Thêm tin nhắn người dùng vào giao diện ngay lập tức
    if (content && currentChat.value) {
      const userMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: content,
        createdAt: new Date().toISOString(),
        chat_id: chatId.value
      };
      
      // Kiểm tra xem tin nhắn đã tồn tại chưa
      const messageExists = currentChat.value.messages?.some(
        msg => msg.role === 'user' && msg.content === content && new Date(msg.createdAt) >= new Date(Date.now() - 5000)
      );
      
      if (!messageExists && currentChat.value.messages) {
        currentChat.value.messages.push(userMessage);
      }
    }
    
    // Gửi tin nhắn và chờ kết quả
    console.log('Sending message to API...');
    const result = await chatStore.sendMessage(chatId.value, content, attachment);
    console.log('Message sent successfully, result:', result);
    
    // Nếu gửi thành công và có kết quả
    if (result) {
      console.log('Resetting typing and sending states');
      // Đảm bảo currentChat được cập nhật
      await chatStore.fetchChatById(chatId.value);
      // Reset trạng thái
      isSending.value = false;
      isTyping.value = false;
    } else {
      console.warn('No result from API');
    }
    
    // Cập nhật title chat nếu là tin nhắn đầu tiên
    if (messages.value.length === 1 && content) {
      chatStore.updateChatTitle(chatId.value, content.substring(0, 30));
    }
  } catch (error) {
    console.error('Error sending message:', error);
    // Reset trạng thái nếu có lỗi
    isSending.value = false;
    isTyping.value = false;
  } finally {
    // Đảm bảo reset isSending
    isSending.value = false;
    
    // Timeout để đảm bảo reset isTyping
    setTimeout(() => {
      if (isTyping.value) {
        console.log('Forced reset typing state after timeout');
        isTyping.value = false;
      }
    }, 8000); // Tăng timeout lên 8 giây
  }
};

// Close dropdown when clicking outside
const closeDropdownOnOutsideClick = (event) => {
  // Kiểm tra xem đang click vào dropdown hoặc nút toggle không
  const dropdownButton = document.querySelector('[data-dropdown-toggle]');
  const dropdownMenu = document.querySelector('[data-dropdown-menu]');
  
  if ((dropdownButton && dropdownButton.contains(event.target)) || 
      (dropdownMenu && dropdownMenu.contains(event.target))) {
    return;
  }
  
  showModelDropdown.value = false;
};

// Lifecycle
onMounted(async () => {
  if (chatId.value) {
    await chatStore.fetchChatById(chatId.value);
  } else {
    // Nếu không có chatId, chuyển hướng về trang chủ
    router.push({ name: 'home' });
  }
  
  // Tải danh sách models
  try {
    console.log('Fetching models...');
    // Thêm timeout để đảm bảo không bị loading quá lâu
    const loadingTimeout = setTimeout(() => {
      if (modelStore.isLoading) {
        console.log('Loading timeout, forcing loading state to false');
        modelStore.loading = false;
      }
    }, 5000);
    
    await modelStore.fetchModels();
    clearTimeout(loadingTimeout);
    console.log('Models fetched:', modelStore.getModels);
  } catch (error) {
    console.error('Error fetching models:', error);
  }
  
  document.addEventListener('click', closeDropdownOnOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdownOnOutsideClick);
});

// Watch route params thay đổi để load chat mới
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await chatStore.fetchChatById(newId);
  }
});

// Xử lý chỉnh sửa tin nhắn
const editMessage = async ({ messageId, newContent, messageIndex }) => {
  try {
    console.log('Xử lý chỉnh sửa tin nhắn:', { messageId, newContent, messageIndex });
    
    // Cập nhật local UI trước để UX mượt hơn
    if (currentChat.value && currentChat.value.messages) {
      const message = currentChat.value.messages[messageIndex];
      if (message) {
        message.content = newContent;
      }
    }
    
    // Tìm tin nhắn AI tiếp theo
    let aiMessageId = null;
    if (currentChat.value && currentChat.value.messages && messageIndex + 1 < currentChat.value.messages.length) {
      const nextMessage = currentChat.value.messages[messageIndex + 1];
      if (nextMessage && !nextMessage.is_user) {
        aiMessageId = nextMessage.id;
      }
    }
    
    // Cần lấy modelId từ store
    const modelId = currentModel.value?.id || 'claude-3-sonnet-20240229';
    // Lấy thông tin provider từ model
    const provider = currentModel.value?.provider || 'anthropic';
    
    // Hiển thị trạng thái đang xử lý
    isTyping.value = true;
    
    // Gọi API để cập nhật tin nhắn
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const apiPrefix = import.meta.env.VITE_API_PREFIX || '/api';
    const response = await fetch(`${apiBaseUrl}${apiPrefix}/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: newContent,
        aiMessageId,
        modelId,
        provider
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.aiMessage) {
      // Cập nhật tin nhắn AI trong UI
      if (currentChat.value && currentChat.value.messages && messageIndex + 1 < currentChat.value.messages.length) {
        const aiMessage = currentChat.value.messages[messageIndex + 1];
        if (aiMessage) {
          aiMessage.content = result.aiMessage.content;
        }
      }
    } else if (!result.success) {
      console.error('Lỗi khi cập nhật tin nhắn:', result.error);
      alert('Có lỗi xảy ra khi cập nhật tin nhắn. Vui lòng thử lại.');
    }
  } catch (error) {
    console.error('Lỗi khi gửi yêu cầu chỉnh sửa tin nhắn:', error);
    alert('Có lỗi xảy ra khi cập nhật tin nhắn. Vui lòng thử lại.');
  } finally {
    isTyping.value = false;
  }
};
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style> 