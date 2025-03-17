<template>
  <div class="message-list bg-gray-100 dark:bg-gray-900" ref="messageList">
    <div v-for="message in messages" :key="message.id" class="message-container" :class="{ 'user-message': isUserMessage(message), 'ai-message': !isUserMessage(message) }">
      <div class="flex items-start gap-3" :class="{ 'flex-row-reverse': isUserMessage(message) }">
        <div 
          class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
          :class="{ 
            'bg-blue-500 text-white': !isUserMessage(message),
            'bg-blue-500 dark:bg-blue-600 text-white': isUserMessage(message)
          }"
        >
          <svg v-if="isUserMessage(message)" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
          <span v-else class="font-bold">C</span>
        </div>
      
        <div class="message" :class="{ 'user-message': isUserMessage(message), 'ai-message': !isUserMessage(message) }">
          <div class="message-header">
            <div class="message-sender">{{ isUserMessage(message) ? 'Bạn' : 'Claude' }}</div>
            <div class="message-time">{{ formatTime(message.createdAt || message.created_at) }}</div>
          </div>
          <div class="message-content" v-html="formatMessage(message.content)"></div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="message-container ai-message">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-1">
          <span class="font-bold">C</span>
        </div>
        
        <div class="message ai-message">
          <div class="message-header">
            <div class="message-sender">Claude</div>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUpdated } from 'vue';
import { UserIcon, ClipboardIcon, PaperClipIcon } from '@heroicons/vue/24/outline';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import formatDistance from 'date-fns/formatDistance';
import vi from 'date-fns/locale/vi';

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  isTyping: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['useSuggestion']);

const messageList = ref(null);

// Kiểm tra xem tin nhắn có phải của người dùng không
const isUserMessage = (message) => {
  // Kiểm tra nhiều trường để xác định tin nhắn của người dùng một cách chính xác
  return (
    message.isUser === true ||
    (message.sender && message.sender.toLowerCase() === 'user')
  );
};

// Gợi ý tin nhắn cho người dùng mới
const suggestions = [
  'Giải thích cho tôi về JavaScript Promises',
  'Viết một đoạn code ví dụ về Vue 3 Composition API',
  'Tôi nên học gì để trở thành một frontend developer giỏi?',
  'So sánh giữa REST API và GraphQL'
];

// Format thời gian
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    return formatDistance(date, new Date(), { addSuffix: true, locale: vi });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

// Format tin nhắn với markdown
const formatMessage = (content) => {
  if (!content) return '';
  
  try {
    // Sử dụng marked để format markdown cơ bản
    const renderer = new marked.Renderer();
    
    // Parse với marked
    const html = marked.parse(content, {
      gfm: true,
      breaks: true
    });
    
    // Làm sạch HTML
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.error('Lỗi khi format message:', error);
    return DOMPurify.sanitize(`<p>${content}</p>`);
  }
};

// Cuộn đến tin nhắn cuối cùng
const scrollToBottom = async () => {
  await nextTick();
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight;
  }
};

// Khi có tin nhắn mới, tự động cuộn xuống dưới
watch(() => props.messages.length, () => {
  scrollToBottom();
});

onMounted(() => {
  scrollToBottom();
});

// Khi component được cập nhật (tin nhắn đang nhận), cuộn xuống
onUpdated(() => {
  scrollToBottom();
});
</script>

<style scoped>
.message-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1rem;
  height: calc(100vh - 140px);
}

.message-container {
  margin-bottom: 1.5rem;
  max-width: 90%;
  align-self: flex-start;
}

.message-container.user-message {
  align-self: flex-end;
}

.message {
  background-color: white;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  max-width: 75%;
  min-width: 200px;
  width: fit-content;
  overflow-wrap: break-word;
}

.dark .message {
  background-color: #1e293b;
  color: #f8fafc;
}

.message.user-message {
  background-color: #e3f2fd;
  color: #0d47a1;
  margin-left: auto;
}

.dark .message.user-message {
  background-color: #1a365d;
  color: #e2e8f0;
}

.message.ai-message {
  background-color: white;
  color: #333;
  margin-right: auto;
}

.dark .message.ai-message {
  background-color: #2d3748;
  color: #e2e8f0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.message-sender {
  font-weight: 600;
}

.message-time {
  color: #718096;
  font-size: 0.75rem;
}

.dark .message-time {
  color: #9ca3af;
}

.message-content {
  font-size: 0.95rem;
  line-height: 1.5;
}

.message-content p {
  margin-bottom: 0.75rem;
}

.message-content p:last-child {
  margin-bottom: 0;
}

/* Style cho typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.typing-indicator span {
  display: block;
  width: 0.5rem;
  height: 0.5rem;
  background-color: #cbd5e0;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-0.25rem);
  }
}
</style>