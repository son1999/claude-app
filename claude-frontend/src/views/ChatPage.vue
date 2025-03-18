<template>
  <div>
    <!-- Các phần khác của template -->
    
    <MessageList 
      :messages="messages" 
      :loading="loading" 
      @editMessage="handleEditMessage" 
    />
    
    <!-- Các phần khác của template -->
  </div>
</template>

<script setup>
// ... imports và code khác

// Thêm hàm xử lý sự kiện editMessage
const handleEditMessage = ({ messageId, newContent, messageIndex }) => {
  console.log('ChatPage nhận được sự kiện editMessage');
  
  // Cách 1: Sử dụng phương pháp reactive
  if (messageIndex >= 0 && messageIndex < messages.value.length) {
    // Tạo bản sao của mảng và thay đổi phần tử
    const updatedMessages = [...messages.value];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: newContent,
      edited: true
    };
    
    // Gán lại toàn bộ mảng để đảm bảo reactivity
    messages.value = updatedMessages;
    
    alert('Đã cập nhật tin nhắn!');
  }
};

// Theo dõi messages để debug
watch(() => messages.value, (newMessages, oldMessages) => {
  console.log('messages đã thay đổi:', { 
    newLength: newMessages.length,
    oldLength: oldMessages?.length,
    newMessages
  });
}, { deep: true });

// Thêm định nghĩa rõ ràng cho messages nếu chưa có
const messages = ref([]);

// ... code khác
</script> 