<template>
  <div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
    <!-- Hiển thị model đang chọn -->
    <div v-if="currentModel" class="mb-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
      <span>Model: </span>
      <span class="ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{{ currentModel.name }}</span>
    </div>
    
    <!-- Phần nhập tin nhắn -->
    <div class="flex items-start space-x-2">
      <textarea
        ref="inputRef"
        v-model="messageContent"
        placeholder="Nhập tin nhắn cho Claude..."
        class="flex-1 p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg resize-none border-0 focus:ring-2 focus:ring-primary focus:outline-none"
        :rows="rows"
        @keydown.enter.prevent="onEnter"
        @input="autoResize"
      ></textarea>
      
      <div class="flex flex-col space-y-2">
        <button
          @click="handleSend"
          :disabled="!canSend || sending"
          class="p-3 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition"
        >
          <svg v-if="sending" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
        
        <button
          @click="toggleAttachment"
          class="p-3 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary/80 rounded-lg transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- File attachment preview -->
    <div v-if="attachment" class="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-between">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="truncate max-w-md text-gray-800 dark:text-gray-200">{{ attachment.name }}</span>
      </div>
      <button @click="removeAttachment" class="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { 
  PaperClipIcon, 
  XMarkIcon,
  ArrowUpIcon 
} from '@heroicons/vue/24/outline';
import { useModelStore } from '../stores/modelStore';

const modelStore = useModelStore();

const props = defineProps({
  chatId: {
    type: String,
    required: true
  },
  sending: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['send']);

const messageContent = ref('');
const attachment = ref(null);
const inputRef = ref(null);
const minRows = 1;
const maxRows = 8;
const rows = ref(minRows);

// Thêm computed property để hiển thị model hiện tại
const currentModel = computed(() => modelStore.getSelectedModel);

// Tính toán xem có thể gửi tin nhắn không
const canSend = computed(() => {
  return messageContent.value.trim() !== '' || attachment.value !== null;
});

// Điều chỉnh chiều cao của textarea
const adjustTextareaHeight = () => {
  const textareaEl = inputRef.value;
  if (!textareaEl) return;
  
  // Reset về chiều cao tối thiểu
  textareaEl.style.height = 'auto';
  
  // Tính số dòng
  const lineHeight = parseInt(getComputedStyle(textareaEl).lineHeight);
  const paddingTop = parseInt(getComputedStyle(textareaEl).paddingTop);
  const paddingBottom = parseInt(getComputedStyle(textareaEl).paddingBottom);
  
  const contentHeight = textareaEl.scrollHeight - paddingTop - paddingBottom;
  let calculatedRows = Math.ceil(contentHeight / lineHeight);
  
  // Giới hạn số dòng
  calculatedRows = Math.max(minRows, Math.min(calculatedRows, maxRows));
  rows.value = calculatedRows;
};

// Xử lý phím Enter
const onEnter = (e) => {
  // Shift + Enter để xuống dòng
  if (e.shiftKey) {
    return true;
  }
  
  // Enter để gửi tin nhắn
  handleSend();
};

// Điều chỉnh chiều cao textarea khi nhập liệu
const autoResize = () => {
  adjustTextareaHeight();
};

// Xử lý đính kèm file
const toggleAttachment = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.pdf,.doc,.docx';
  input.onchange = (e) => {
    if (e.target.files.length > 0) {
      attachment.value = e.target.files[0];
    }
  };
  input.click();
};

// Gửi tin nhắn - đổi tên từ sendMessage thành handleSend để khớp với template
const handleSend = () => {
  if (!canSend.value || props.sending) return;
  
  const content = messageContent.value.trim();
  emit('send', {
    content: content,
    attachment: attachment.value
  });
  
  // Reset sau khi gửi
  messageContent.value = '';
  removeAttachment();
  rows.value = minRows;
  
  // Focus lại vào textarea
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
};

// Xóa file đính kèm
const removeAttachment = () => {
  attachment.value = null;
};

// Watch tin nhắn thay đổi để điều chỉnh chiều cao
watch(messageContent, () => {
  nextTick(adjustTextareaHeight);
});
</script> 