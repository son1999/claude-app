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
            <div class="message-time">
              {{ formatTime(message.createdAt || message.created_at) }}
              <button v-if="isUserMessage(message) && !editingMessageId" 
                     @click="startEditMessage(message)" 
                     class="edit-button ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="editingMessageId === message.id" class="edit-message-container">
            <textarea 
              v-model="editedMessageContent" 
              class="edit-textarea"
              rows="3"
              @keydown.esc="cancelEdit"
              @keydown.ctrl.enter="saveEdit"
            ></textarea>
            <div class="edit-actions">
              <button @click="saveEdit" class="edit-save-button">Lưu</button>
              <button @click="cancelEdit" class="edit-cancel-button">Hủy</button>
            </div>
          </div>
          <div v-else class="message-content" v-html="formatMessage(message.content)"></div>
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
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

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

const emit = defineEmits(['useSuggestion', 'editMessage']);

const messageList = ref(null);
const editingMessageId = ref(null);
const editedMessageContent = ref('');

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
    // Regex để phát hiện code block 
    const codeBlockRegex = /```([\w]*)\s*\n([\s\S]*?)```/g;
    
    let contentWithCodeBlocks = content;
    let match;
    let hasCodeBlocks = false;
    let codeBlockCounter = 0;
    
    // Kiểm tra nếu có code blocks
    if (codeBlockRegex.test(content)) {
      hasCodeBlocks = true;
      // Reset regex để bắt đầu lại từ đầu
      codeBlockRegex.lastIndex = 0;
      
      // Thay thế tất cả code blocks trong nội dung
      while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = match[1] ? match[1].trim() : 'plaintext';
        const code = match[2].trim();
        const codeBlockId = `code-block-${codeBlockCounter++}`;
        
        const codeBlockHTML = formatCodeBlock(code, language, codeBlockId);
        
        // Tạo một chuỗi để thay thế trong nội dung
        const placeholder = match[0];
        contentWithCodeBlocks = contentWithCodeBlocks.replace(placeholder, `<div class="markdown-code-block">${codeBlockHTML}</div>`);
      }
    }
    
    // Sử dụng marked để format markdown cơ bản
    const renderer = new marked.Renderer();
    
    // Parse với marked
    const html = marked.parse(hasCodeBlocks ? contentWithCodeBlocks : content, {
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

// Format code thành HTML với khung và nút sao chép
const formatCodeBlock = (code, language, blockId) => {
  // Xác định ngôn ngữ, mặc định là plaintext
  const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
  
  // Highlight code
  let highlightedCode;
  try {
    // Xử lý các ký tự đặc biệt trong code
    const decodedCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
    
    highlightedCode = hljs.highlight(decodedCode, { language: validLanguage }).value;
  } catch (e) {
    console.error('Lỗi highlight code:', e);
    highlightedCode = hljs.highlightAuto(code).value;
  }
  
  // Tạo HTML cho code block với ID duy nhất và không dùng @click
  return `
    <div class="code-container">
      <div class="code-header">
        <div class="code-title">${validLanguage}</div>
        <div class="code-actions">
          <button class="copy-button" id="${blockId}-copy">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </button>
        </div>
      </div>
      <div class="code-block" style="max-width: 100%;">
        <pre style="max-width: 100%;"><code class="${validLanguage}" data-code="${encodeURIComponent(code)}" id="${blockId}">${highlightedCode}</code></pre>
      </div>
    </div>
  `;
};

// Hàm xử lý sự kiện khi click vào nút copy
const handleCopyClick = (event) => {
  const button = event.currentTarget;
  const blockId = button.id.replace('-copy', '');
  const codeElement = document.getElementById(blockId);
  
  if (codeElement) {
    const encodedCode = codeElement.getAttribute('data-code');
    
    try {
      const decodedCode = decodeURIComponent(encodedCode);
      
      // Sử dụng phương thức cũ document.execCommand để hoạt động trên HTTP
      const textarea = document.createElement('textarea');
      textarea.value = decodedCode;
      textarea.style.position = 'fixed';  // Tránh scroll xuống
      textarea.style.opacity = '0';       // Ẩn textarea
      document.body.appendChild(textarea);
      textarea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        // Thêm hiệu ứng đã sao chép
        button.classList.add('copied');
        
        // Thay đổi icon thành dấu check trong giây lát
        const originalHTML = button.innerHTML;
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        `;
        
        // Trả lại trạng thái ban đầu sau 2 giây
        setTimeout(() => {
          button.classList.remove('copied');
          button.innerHTML = originalHTML;
        }, 2000);
      } else {
        throw new Error('Không thể sao chép bằng execCommand');
      }
    } catch (error) {
      console.log(error);
      console.error('Lỗi khi sao chép mã:', error);
      alert('Lỗi khi sao chép mã. Vui lòng thử lại.');
      
      // Thử phương pháp thay thế nếu execCommand không hoạt động
      try {
        const decodedCode = decodeURIComponent(encodedCode);
        navigator.clipboard.writeText(decodedCode)
          .then(() => {
            // Thêm hiệu ứng đã sao chép
            button.classList.add('copied');
            
            // Thay đổi icon thành dấu check trong giây lát
            const originalHTML = button.innerHTML;
            button.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            `;
            
            // Trả lại trạng thái ban đầu sau 2 giây
            setTimeout(() => {
              button.classList.remove('copied');
              button.innerHTML = originalHTML;
            }, 2000);
          })
          .catch(err => {
            console.error('Không thể sao chép văn bản: ', err);
            alert('Không thể sao chép mã. Vui lòng thử lại.');
          });
      } catch (backupError) {
        console.error('Cả hai phương pháp sao chép đều không hoạt động:', backupError);
        alert('Không thể sao chép mã. Vui lòng thử phương pháp thủ công (Ctrl+C).');
      }
    }
  }
};

// Thêm hàm để gắn các trình xử lý sự kiện sau khi component được cập nhật
const attachCopyHandlers = () => {
  // Tìm tất cả các nút copy
  const copyButtons = document.querySelectorAll('.copy-button');
  
  copyButtons.forEach(button => {
    // Xóa bất kỳ trình xử lý sự kiện đã tồn tại
    button.removeEventListener('click', handleCopyClick);
    
    // Thêm trình xử lý sự kiện mới
    button.addEventListener('click', handleCopyClick);
  });
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
  attachCopyHandlers(); // Gắn handler sau khi DOM được tạo lần đầu
});

// Khi component được cập nhật (tin nhắn đang nhận), cuộn xuống
onUpdated(() => {
  scrollToBottom();
  attachCopyHandlers(); // Gắn handler sau khi DOM cập nhật
});

// Bắt đầu chỉnh sửa tin nhắn
const startEditMessage = (message) => {
  editingMessageId.value = message.id;
  editedMessageContent.value = message.content;
  
  // Đảm bảo DOM được cập nhật và focusable
  nextTick(() => {
    const textarea = document.querySelector('.edit-textarea');
    if (textarea) {
      textarea.focus();
    }
  });
};

// Lưu thay đổi tin nhắn
const saveEdit = () => {
  console.log('saveEdit called', editingMessageId.value);
  if (!editingMessageId.value) return;
  
  // Tìm tin nhắn đang được chỉnh sửa
  const messageIndex = props.messages.findIndex(m => m.id === editingMessageId.value);
  console.log('Found message at index:', messageIndex);
  if (messageIndex === -1) return;
  
  const messageId = editingMessageId.value;
  const newContent = editedMessageContent.value;
  
  // Log trước khi emit
  console.log('Emitting editMessage event', {
    messageId,
    newContent,
    messageIndex
  });
  
  // Phát ra sự kiện để component cha xử lý việc cập nhật tin nhắn
  // Sử dụng cấu trúc dữ liệu rõ ràng hơn
  emit('editMessage', {
    messageId,
    newContent,
    messageIndex
  });
  
  // Reset trạng thái chỉnh sửa
  editingMessageId.value = null;
  editedMessageContent.value = '';
};

// Hủy chỉnh sửa
const cancelEdit = () => {
  editingMessageId.value = null;
  editedMessageContent.value = '';
};
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
  max-width: 90%;
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

.ai-message {
  max-width: 850px;
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
  max-width: 100%;
  overflow-wrap: break-word;
  word-break: break-word;
}

.message-content p {
  margin-bottom: 0.75rem;
  max-width: 100%;
}

.message-content p:last-child {
  margin-bottom: 0;
}

.message-content pre {
  white-space: pre;
  overflow-x: auto;
  max-width: 100%;
}

.message-content pre code {
  white-space: pre;
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

/* Style cho code blocks */
.code-container {
  margin: 1rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #1e1e1e;
  border: 1px solid #2d2d2d;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: fit-content;
  max-width: 100%;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #2d2d2d;
  border-bottom: 1px solid #3e3e3e;
  width: 100%;
  z-index: 5;
  position: relative;
}

.code-title {
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: #e0e0e0;
  text-transform: uppercase;
}

.code-actions {
  display: flex;
  gap: 0.5rem;
  position: relative;
  z-index: 10;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #e0e0e0;
  background-color: #3e3e3e;
  border: 1px solid #4e4e4e;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  pointer-events: auto;
}

.copy-button:hover {
  background-color: #4e4e4e;
  border-color: #5e5e5e;
}

.copy-button.copied {
  background-color: #065f46;
  border-color: #047857;
  color: #ecfdf5;
}

.copy-button svg {
  pointer-events: none;
}

.code-block {
  padding: 0;
  margin: 0;
  overflow-x: auto;
  max-width: 550px;
}

.code-block pre {
  margin: 0;
  padding: 1rem;
  background-color: #1e1e1e;
  white-space: pre;
}

.code-block code {
  font-family: 'Fira Code', Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #e0e0e0;
}

/* Thêm style cho highlight.js */
:deep(.hljs) {
  background-color: #1e1e1e !important;
  color: #e0e0e0 !important;
}

:deep(.hljs-keyword) {
  color: #569cd6 !important;
}

:deep(.hljs-string) {
  color: #ce9178 !important;
}

:deep(.hljs-comment) {
  color: #6a9955 !important;
}

:deep(.hljs-function) {
  color: #dcdcaa !important;
}

:deep(.hljs-number) {
  color: #b5cea8 !important;
}

:deep(.hljs-operator) {
  color: #d4d4d4 !important;
}

:deep(.hljs-punctuation) {
  color: #d4d4d4 !important;
}

:deep(.hljs-variable) {
  color: #9cdcfe !important;
}

:deep(.hljs-params) {
  color: #9cdcfe !important;
}

:deep(.hljs-built_in) {
  color: #4ec9b0 !important;
}

/* Markdown code block */
.markdown-code-block {
  margin: 1rem 0;
  max-width: 100%;
  overflow: hidden;
}

/* Style cho chức năng chỉnh sửa tin nhắn */
.edit-button {
  opacity: 0;
  transition: opacity 0.2s ease;
  color: #64748b;
}

.message-header:hover .edit-button {
  opacity: 1;
}

.edit-button:hover {
  color: #2563eb;
}

.edit-message-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.edit-textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  background-color: white;
  color: #334155;
  resize: vertical;
}

.dark .edit-textarea {
  background-color: #1e293b;
  border-color: #475569;
  color: #f8fafc;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.edit-save-button, .edit-cancel-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-save-button {
  background-color: #2563eb;
  color: white;
  border: none;
}

.edit-save-button:hover {
  background-color: #1d4ed8;
}

.edit-cancel-button {
  background-color: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.dark .edit-cancel-button {
  color: #94a3b8;
  border-color: #475569;
}

.edit-cancel-button:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.dark .edit-cancel-button:hover {
  background-color: #334155;
  color: #e2e8f0;
}
</style>