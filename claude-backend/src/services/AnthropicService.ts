import anthropic from '../config/anthropic';
import fs from 'fs';
import path from 'path';

class AnthropicService {
  /**
   * Lấy danh sách các mô hình AI từ Anthropic
   */
  async getModels() {
    try {
      // Sử dụng API /v1/models để lấy danh sách model từ Anthropic
      const modelsResponse = await anthropic.models.list();
      
      if (modelsResponse && modelsResponse.data) {
        // Chuyển đổi từ định dạng API sang định dạng ứng dụng
        return modelsResponse.data.map(model => ({
          id: model.id,
          name: model.display_name || model.id,
          description: `${model.display_name || model.id} model` 
        }));
      }
      
      // Danh sách dự phòng nếu API không trả về dữ liệu
      return [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful model for highly complex tasks' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Ideal balance of intelligence and speed' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest and most compact model for near-instant responsiveness' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Enhanced capabilities with faster performance' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Latest fast and efficient model' }
      ];
    } catch (error) {
      console.error('Lỗi khi lấy danh sách models:', error);
      
      // Trả về danh sách cứng nếu API gặp lỗi
      return [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful model for highly complex tasks' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Ideal balance of intelligence and speed' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest and most compact model for near-instant responsiveness' }
      ];
    }
  }

  /**
   * Gửi tin nhắn đến Claude và nhận phản hồi
   */
  async sendMessage(prompt: string, modelId: string, attachmentPath?: string) {
    try {
      const messages = [];

      // Tin nhắn từ người dùng
      const userMessage: any = {
        role: 'user',
        content: prompt
      };

      // Nếu có file đính kèm, thêm vào tin nhắn
      if (attachmentPath) {
        // Kiểm tra xem file có tồn tại không
        if (!fs.existsSync(attachmentPath)) {
          throw new Error('File không tồn tại');
        }

        // Lấy MIME type dựa trên phần mở rộng của file
        const extension = path.extname(attachmentPath).toLowerCase();
        let mediaType;
        
        switch (extension) {
          case '.jpg':
          case '.jpeg':
            mediaType = 'image/jpeg';
            break;
          case '.png':
            mediaType = 'image/png';
            break;
          case '.gif':
            mediaType = 'image/gif';
            break;
          case '.webp':
            mediaType = 'image/webp';
            break;
          case '.pdf':
            mediaType = 'application/pdf';
            break;
          default:
            throw new Error('Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF, WebP và PDF.');
        }

        // Đọc file dưới dạng base64
        const fileContent = fs.readFileSync(attachmentPath);
        const base64Content = fileContent.toString('base64');

        // Thêm file vào tin nhắn
        const contentArray: any[] = [{ type: 'text', text: prompt }];

        if (mediaType === 'application/pdf') {
          // Xử lý file PDF theo tài liệu chính thức của Anthropic
          contentArray.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64Content
            }
          });
        } else {
          // Xử lý file hình ảnh
          contentArray.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Content
            }
          });
        }

        // Debug log trước khi gửi request
        console.log('Request message structure:', JSON.stringify({
          role: userMessage.role,
          content: [`${contentArray.length} items: [0]=${contentArray[0].type}, [1]=${contentArray[1]?.type || 'none'}`]
        }, null, 2));

        userMessage.content = contentArray;
      }

      messages.push(userMessage);

      // Gửi tin nhắn đến Claude API
      const response = await anthropic.messages.create({
        model: modelId,
        max_tokens: 20000,
        messages,
        temperature: 0.7
      });

      // Xử lý phản hồi từ API
      let responseText = '';
      if (response.content && response.content.length > 0) {
        // Lấy nội dung text từ phản hồi
        const textContent = response.content.find(item => item.type === 'text');
        if (textContent && 'text' in textContent) {
          responseText = textContent.text;
        }
      }

      return {
        content: responseText,
        model: response.model,
        id: response.id
      };
    } catch (error: any) {
      console.error('Lỗi khi gửi tin nhắn đến Anthropic:', error);
      throw new Error(`Không thể gửi tin nhắn: ${error.message}`);
    }
  }
}

export default new AnthropicService(); 