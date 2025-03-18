// Thêm route PUT để cập nhật tin nhắn
router.put('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, conversationId, aiResponseId } = req.body;
    
    console.log(`Đang cập nhật tin nhắn: ${id} với nội dung: ${content}`);
    
    // Cập nhật tin nhắn người dùng trong DB
    // Giả sử bạn có hàm updateMessage trong model/message.js
    // await Message.updateMessage(id, content);
    
    // Nếu không có aiResponseId, chỉ cập nhật tin nhắn người dùng
    if (!aiResponseId) {
      return res.status(200).json({
        success: true
      });
    }
    
    // Nếu có aiResponseId, cần tạo phản hồi mới từ Claude
    // Lấy lịch sử cuộc trò chuyện đến tin nhắn hiện tại
    const conversationHistory = [
      { role: "user", content: content }
    ];
    
    // Gọi Claude API (tùy thuộc vào cấu hình của bạn)
    // Ví dụ:
    const anthropic = require('@anthropic-ai/sdk');
    const client = new anthropic.Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const aiResponse = await client.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-3-opus-20240229",
      max_tokens: 4096,
      messages: conversationHistory,
    });
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      aiMessage: {
        id: aiResponseId,
        content: aiResponse.content[0].text
      }
    });
  } catch (error) {
    console.error('Error updating message:', error);
    return res.status(500).json({
      success: false,
      error: 'Không thể cập nhật tin nhắn: ' + error.message
    });
  }
}); 