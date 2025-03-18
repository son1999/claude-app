/// <reference types="node" />

import anthropic from '../config/anthropic';
import fs from 'fs';
import path from 'path';
import type { Anthropic } from '@anthropic-ai/sdk';

interface DataNode {
  id: string;
  content: string;
}

interface ModelInfo {
  id: string;
  display_name?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{type: string; text?: string; source?: any}>;
}

interface ModelResponse {
  id: string;
  display_name?: string;
  description?: string;
}

interface MessageContentItem {
  type: string;
  text?: string;
}

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
        return modelsResponse.data.map((model: ModelResponse) => ({
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
   * Lấy thông tin chi tiết và giới hạn của một model
   */
  async getModelLimits(modelId: string) {
    try {
      // Lấy chi tiết model từ API
      const modelResponse = await anthropic.models.retrieve(modelId);
      
      // Trả về thông tin giới hạn
      // Sử dụng any cast tạm thời để giải quyết các vấn đề về types chưa đầy đủ từ SDK
      const modelInfo = modelResponse as any;
      
      return {
        maxTokens: modelInfo.max_tokens || 4096,
        contextWindow: modelInfo.context_window || 16384,
        name: modelInfo.id || modelId,
        description: modelInfo.description || `Model ${modelId}`
      };
    } catch (error: any) {
      console.error(`Lỗi khi lấy thông tin model ${modelId}:`, error);
      throw new Error(`Không thể lấy thông tin model: ${error.message}`);
    }
  }

  /**
   * Gửi tin nhắn đến Claude và nhận phản hồi
   */
  async sendMessage(prompt: string, modelId: string, attachmentPath?: string, conversationHistory?: any[], contextSummary?: string) {
    try {
      // Lấy thông tin giới hạn model
      let maxTokens;
      try {
        const modelLimits = await this.getModelLimits(modelId);
        maxTokens = Math.min(4096, modelLimits.maxTokens); // Lấy giới hạn từ API nhưng giữ an toàn
        console.log(`Model ${modelId} có giới hạn: ${maxTokens} tokens`);
      } catch (error) {
        maxTokens = 4096;
        console.log(`Sử dụng giới hạn mặc định: ${maxTokens} tokens`);
      }

      const messages = [];
      
      // Thêm context summary nếu có (Phương pháp tối ưu token #1: Tóm tắt hội thoại)
      if (contextSummary) {
        messages.push({
          role: 'system',
          content: contextSummary
        });
      }
      
      // Thêm lịch sử hội thoại nếu có (giới hạn số lượng tin nhắn để tối ưu token)
      if (conversationHistory && conversationHistory.length > 0) {
        // Chuyển đổi định dạng tin nhắn nếu cần
        const formattedHistory = conversationHistory.map(msg => ({
          role: msg.is_user ? 'user' : 'assistant',
          content: msg.content
        }));
        messages.push(...formattedHistory);
      }

      // Tin nhắn từ người dùng
      const userMessage: any = {
        role: 'user',
        content: prompt
      };

      // Nếu có file đính kèm, thêm vào tin nhắn
      if (attachmentPath) {
        // Log để debug
        console.log(`Xử lý file đính kèm: ${attachmentPath}`);
        
        // Kiểm tra xem file có tồn tại không
        if (!fs.existsSync(attachmentPath)) {
          console.error(`File không tồn tại: ${attachmentPath}`);
          throw new Error(`File không tồn tại: ${attachmentPath}`);
        }

        try {
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
              throw new Error(`Định dạng file ${extension} không được hỗ trợ`);
          }

          // Đọc file dưới dạng Buffer và chuyển sang base64
          const fileContent = fs.readFileSync(attachmentPath);
          const base64Content = fileContent.toString('base64');
          
          // Log kích thước file để debug
          console.log(`Kích thước file: ${(fileContent.length / (1024 * 1024)).toFixed(2)}MB`);

          // Tạo nội dung tin nhắn dạng mảng
          const contentArray: any[] = [{ type: 'text', text: prompt }];

          if (mediaType === 'application/pdf') {
            contentArray.push({
              type: 'document',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Content
              }
            });
          } else {
            contentArray.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Content
              }
            });
          }

          // Log cấu trúc tin nhắn để debug (không in ra dữ liệu base64)
          console.log('Cấu trúc tin nhắn:', JSON.stringify({
            role: 'user',
            content: [
              { type: contentArray[0].type },
              { type: contentArray[1].type, media_type: contentArray[1].source.media_type }
            ]
          }, null, 2));

          userMessage.content = contentArray;
        } catch (fileError: any) {
          console.error(`Lỗi xử lý file: ${fileError.message}`);
          throw new Error(`Lỗi xử lý file: ${fileError.message}`);
        }
      }

      messages.push(userMessage);

      // Log để debug
      console.log('Sending messages to Claude API:');
      console.log('Total messages:', messages.length);
      console.log('Context summary included:', !!contextSummary);
      console.log('History messages included:', conversationHistory?.length || 0);

      // Gửi tin nhắn đến Claude API
      const response = await anthropic.messages.create({
        model: modelId,
        max_tokens: maxTokens,
        messages,
        temperature: 0.7
      });

      // Xử lý phản hồi từ API
      let responseText = '';
      if (response.content && response.content.length > 0) {
        // Lấy nội dung text từ phản hồi
        const textContent = response.content.find((item: MessageContentItem) => item.type === 'text');
        if (textContent && 'text' in textContent) {
          responseText = textContent.text || '';
        }
      }

      return {
        content: responseText,
        model: response.model,
        id: response.id
      };
    } catch (error: any) {
      console.error('Chi tiết lỗi từ Anthropic API:', error);
      if (error.status) {
        console.error(`HTTP Status: ${error.status}, ${error.message}`);
      }
      throw new Error(`Không thể gửi tin nhắn: ${error.message}`);
    }
  }
}

export default new AnthropicService(); 