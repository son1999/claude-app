<template>
  <div class="flex h-screen">
    <ChatSidebar />
    
    <div class="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="text-center p-8 max-w-lg">
        <div class="text-6xl font-bold text-primary mb-6">Claude</div>
        <h1 class="text-2xl font-bold mb-4">Chào mừng đến với Claude AI</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-8">
          Trợ lý AI thông minh, hữu ích và trung thực. Hãy bắt đầu một cuộc trò chuyện mới hoặc chọn từ các cuộc trò chuyện trước đó.
        </p>
        
        <button 
          @click="createNewChat" 
          class="btn btn-primary px-6 py-3 text-lg flex items-center justify-center mx-auto"
          :disabled="isLoading"
        >
          <PlusIcon class="h-5 w-5 mr-2" />
          <span>Bắt đầu cuộc trò chuyện mới</span>
          <div v-if="isLoading" class="ml-2 animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
        </button>
        
        <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="feature in features" 
            :key="feature.title"
            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <component :is="feature.icon" class="h-8 w-8 text-primary mb-2" />
            <h3 class="font-semibold mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '../stores/chatStore';
import ChatSidebar from '../components/ChatSidebar.vue';
import { 
  PlusIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  PencilIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const chatStore = useChatStore();

const isLoading = computed(() => chatStore.isLoading);

const features = [
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Trò chuyện thông minh',
    description: 'Trò chuyện tự nhiên về bất kỳ chủ đề nào với hiểu biết sâu rộng'
  },
  {
    icon: CodeBracketIcon,
    title: 'Viết và debug code',
    description: 'Hỗ trợ nhiều ngôn ngữ lập trình, giúp bạn viết và sửa code'
  },
  {
    icon: DocumentTextIcon,
    title: 'Tạo và chỉnh sửa văn bản',
    description: 'Viết, sửa và cải thiện văn bản theo yêu cầu của bạn'
  },
  {
    icon: PencilIcon,
    title: 'Tùy chỉnh linh hoạt',
    description: 'Điều chỉnh tham số để nhận được kết quả phù hợp với nhu cầu'
  }
];

const createNewChat = async () => {
  const newChat = await chatStore.createChat();
  if (newChat) {
    router.push({ name: 'chat', params: { id: newChat.id } });
  }
};
</script> 