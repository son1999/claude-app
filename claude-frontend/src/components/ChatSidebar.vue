<template>
  <div class="w-64 bg-gray-100 dark:bg-gray-800 h-screen flex flex-col border-r border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-primary">Claude</h1>
      <button 
        @click="createNewChat" 
        class="btn btn-primary flex items-center"
        :disabled="isLoading"
      >
        <PlusIcon class="h-5 w-5 mr-1" />
        <span>Mới</span>
      </button>
    </div>
    
    <!-- Search -->
    <div class="p-4">
      <div class="relative">
        <MagnifyingGlassIcon class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Tìm kiếm..." 
          class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
      </div>
    </div>
    
    <!-- Chat list -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="isLoading && !chats.length" class="flex justify-center items-center h-32">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      
      <div v-else-if="!filteredChats.length" class="p-4 text-center text-gray-500">
        {{ chats.length ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện nào' }}
      </div>
      
      <div v-else class="space-y-1 p-2">
        <div 
          v-for="chat in filteredChats" 
          :key="chat.id"
          @click="selectChat(chat)"
          class="p-3 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-200 dark:bg-gray-700': currentChat && currentChat.id === chat.id }"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-medium truncate flex-1">
              {{ getChatTitle(chat) }}
            </h3>
            <button 
              @click.stop="confirmDelete(chat)"
              class="text-gray-500 hover:text-red-500"
              title="Xóa cuộc trò chuyện"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
            {{ getLastMessage(chat) }}
          </p>
          <div class="text-xs text-gray-400 mt-1">
            {{ formatDate(chat.updatedAt || chat.createdAt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Xóa cuộc trò chuyện"
      :message="'Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.'"
      confirm-text="Xóa"
      cancel-text="Hủy"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '../stores/chatStore';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  TrashIcon 
} from '@heroicons/vue/24/outline';
import ConfirmModal from './ConfirmModal.vue';

const router = useRouter();
const chatStore = useChatStore();
const searchQuery = ref('');
const showDeleteModal = ref(false);
const chatToDelete = ref(null);

// Computed properties
const chats = computed(() => chatStore.getChats);
const currentChat = computed(() => chatStore.getCurrentChat);
const isLoading = computed(() => chatStore.isLoading);

const filteredChats = computed(() => {
  if (!searchQuery.value) return chats.value;
  
  const query = searchQuery.value.toLowerCase();
  return chats.value.filter(chat => {
    const title = getChatTitle(chat).toLowerCase();
    const lastMsg = getLastMessage(chat).toLowerCase();
    return title.includes(query) || lastMsg.includes(query);
  });
});

// Methods
const createNewChat = async () => {
  try {
    console.log("Starting to create new chat");
    const newChat = await chatStore.createChat();
    console.log("Created new chat:", newChat);
    
    if (newChat && newChat.id) {
      console.log("Redirecting to chat page with ID:", newChat.id);
      router.push({ name: 'chat', params: { id: newChat.id }});
    } else {
      console.error("Không thể tạo chat mới: Không có ID chat", newChat);
      alert("Không thể tạo chat mới. Vui lòng thử lại sau.");
    }
  } catch (error) {
    console.error("Error in createNewChat:", error);
    alert("Đã xảy ra lỗi khi tạo chat mới: " + (error.message || "Lỗi không xác định"));
  }
};

const selectChat = (chat) => {
  chatStore.setCurrentChat(chat);
  router.push({ name: 'chat', params: { id: chat.id }});
};

const confirmDelete = (chat) => {
  chatToDelete.value = chat;
  showDeleteModal.value = true;
};

const handleDeleteConfirm = async () => {
  if (!chatToDelete.value) return;
  
  await chatStore.deleteChat(chatToDelete.value.id);
  
  // Nếu đang ở trang chat bị xóa, chuyển về trang chính
  if (router.currentRoute.value.params.id === chatToDelete.value.id) {
    router.push({ name: 'home' });
  }
  
  // Reset state
  showDeleteModal.value = false;
  chatToDelete.value = null;
};

const getChatTitle = (chat) => {
  if (chat.title) return chat.title;
  
  // Lấy nội dung tin nhắn đầu tiên để làm tiêu đề
  if (chat.messages && chat.messages.length > 0) {
    const firstMsg = chat.messages[0].content;
    return firstMsg.substring(0, 30) + (firstMsg.length > 30 ? '...' : '');
  }
  
  return 'Cuộc trò chuyện mới';
};

const getLastMessage = (chat) => {
  if (!chat.messages || chat.messages.length === 0) {
    return 'Chưa có tin nhắn';
  }
  
  const lastMsg = chat.messages[chat.messages.length - 1];
  return lastMsg.content.substring(0, 40) + (lastMsg.content.length > 40 ? '...' : '');
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Lifecycle hooks
onMounted(async () => {
  await chatStore.fetchChats();
});
</script> 