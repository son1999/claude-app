import AnthropicService from './AnthropicService';
import OpenAIService from './OpenAIService';

class ModelService {
  /**
   * Lấy danh sách các mô hình AI từ tất cả các nhà cung cấp
   */
  async getModels() {
    try {
      // Lấy danh sách models từ Anthropic
      const anthropicModels = await AnthropicService.getModels();
      
      // Lấy danh sách models từ OpenAI
      const openaiModels = await OpenAIService.getModels();
      
      // Thêm prefix để phân biệt các model từ các nhà cung cấp khác nhau
      const formattedAnthropicModels = anthropicModels.map(model => ({
        ...model,
        provider: 'Claude'
      }));
      
      const formattedOpenAIModels = openaiModels.map(model => ({
        ...model,
        provider: 'GPT'
      }));
      
      // Kết hợp tất cả models
      return [
        ...formattedAnthropicModels,
        ...formattedOpenAIModels
      ];
    } catch (error) {
      console.error('Lỗi khi lấy danh sách models:', error);
      throw error;
    }
  }
  
  /**
   * Lấy thông tin chi tiết của một model
   */
  async getModelLimits(modelId: string, provider?: string) {
    try {
      // Xác định nhà cung cấp từ model ID nếu không được cung cấp
      if (!provider) {
        if (modelId.includes('gpt')) {
          provider = 'GPT';
        } else {
          provider = 'Claude';
        }
      }
      
      // Gọi service tương ứng dựa trên provider thực tế
      const realProvider = this.getRealProvider(provider);
      
      if (realProvider === 'openai') {
        return await OpenAIService.getModelLimits(modelId);
      } else {
        return await AnthropicService.getModelLimits(modelId);
      }
    } catch (error: any) {
      console.error(`Lỗi khi lấy thông tin model ${modelId}:`, error);
      throw new Error(`Không thể lấy thông tin model: ${error.message}`);
    }
  }

  /**
   * Gửi tin nhắn đến model AI và nhận phản hồi
   */
  async sendMessage(
    prompt: string, 
    modelId: string, 
    provider: string | undefined, 
    attachmentPath?: string, 
    conversationHistory?: any[], 
    contextSummary?: string,
    fileIds?: string[]
  ) {
    try {
      // Xác định nhà cung cấp từ model ID nếu không được cung cấp
      if (!provider) {
        if (modelId.includes('gpt')) {
          provider = 'GPT';
        } else {
          provider = 'Claude';
        }
      }
      
      console.log(`Gửi tin nhắn đến provider: ${provider}, model: ${modelId}`);
      if (fileIds && fileIds.length > 0) {
        console.log(`Đính kèm ${fileIds.length} file đã upload:`, fileIds);
      }
      
      // Gọi service tương ứng dựa trên provider thực tế
      const realProvider = this.getRealProvider(provider);
      
      if (realProvider === 'openai') {
        return await OpenAIService.sendMessage(prompt, modelId, attachmentPath, fileIds, conversationHistory, contextSummary);
      } else {
        // Anthropic chưa hỗ trợ file uploads API, chỉ sử dụng attachmentPath
        return await AnthropicService.sendMessage(prompt, modelId, attachmentPath, conversationHistory, contextSummary);
      }
    } catch (error: any) {
      console.error(`Lỗi khi gửi tin nhắn đến ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Upload file lên các model AI
   */
  async uploadFile(filePath: string, provider: string, purpose: string = 'assistants') {
    try {
      console.log(`Bắt đầu upload file ${filePath} lên ${provider} với mục đích ${purpose}`);
      
      if (!provider) {
        // Mặc định là OpenAI nếu không cung cấp
        provider = 'GPT';
      }
      
      // Chuyển đổi provider hiển thị sang provider thực tế
      const realProvider = this.getRealProvider(provider);
      
      if (realProvider === 'openai') {
        return await OpenAIService.uploadFile(filePath, purpose);
      } else if (realProvider === 'anthropic') {
        // Anthropic chưa hỗ trợ file uploads API
        throw new Error('Anthropic chưa hỗ trợ file uploads API');
      } else {
        throw new Error('Provider không hợp lệ. Chỉ hỗ trợ "GPT" hoặc "Claude"');
      }
    } catch (error: any) {
      console.error('Lỗi khi upload file:', error);
      throw error;
    }
  }
  
  /**
   * Chuyển đổi từ provider hiển thị sang provider thực tế
   */
  private getRealProvider(displayProvider: string): string {
    switch (displayProvider) {
      case 'GPT':
        return 'openai';
      case 'Claude':
        return 'anthropic';
      default:
        // Fallback cho các trường hợp vẫn dùng tên cũ
        if (displayProvider === 'openai') return 'openai';
        if (displayProvider === 'anthropic') return 'anthropic';
        // Mặc định là openai nếu không xác định được
        return 'openai';
    }
  }
}

export default new ModelService(); 