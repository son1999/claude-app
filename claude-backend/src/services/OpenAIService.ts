import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<any>;
}

interface ModelResponse {
  id: string;
  name?: string;
  display_name?: string;
  description?: string;
  created?: number;
  owned_by?: string;
  context_window?: number;
  capabilities?: {
    context_window?: number;
    max_tokens?: number;
  };
  limits?: {
    context_window?: number;
    max_tokens?: number;
  };
}

class OpenAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY không được cấu hình trong file .env');
    } else {
      // Kiểm tra API key có đúng định dạng không
      const keyPrefix = this.apiKey.substring(0, 7);
      const keyLength = this.apiKey.length;
      console.log(`OpenAI API Key đã được cấu hình. Prefix: ${keyPrefix}..., độ dài: ${keyLength} ký tự`);
    }
  }

  /**
   * Tạo upload file mới trên OpenAI
   * @param purpose Mục đích của file (assistants)
   * @param fileSize Kích thước file tính bằng bytes
   * @param fileName Tên file
   * @returns Thông tin về upload đã được tạo
   */
  async createUpload(purpose: string, fileSize: number, fileName: string) {
    try {
      console.log(`Tạo upload file ${fileName} với kích thước ${fileSize} bytes`);
      
      const response = await axios.post(
        `${this.baseUrl}/uploads`,
        {
          purpose,
          file_size: fileSize,
          file_name: fileName
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi tạo upload:', error.response?.data || error.message);
      throw new Error(`Lỗi khi tạo upload: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Thêm phần dữ liệu vào upload
   * @param uploadId ID của upload
   * @param data Dữ liệu file (Buffer)
   * @param partNumber Số thứ tự của phần
   * @returns Thông tin về phần đã được thêm
   */
  async addUploadPart(uploadId: string, data: Buffer, partNumber: number) {
    try {
      console.log(`Thêm phần ${partNumber} cho upload ${uploadId}`);
      
      const response = await axios.post(
        `${this.baseUrl}/uploads/${uploadId}/parts`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/octet-stream',
            'OpenAI-Beta': 'assistants=v2',
            'X-Part-Number': partNumber.toString(),
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi thêm phần ${partNumber} cho upload ${uploadId}:`, error.response?.data || error.message);
      throw new Error(`Lỗi khi thêm phần upload: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Hoàn thành quá trình upload
   * @param uploadId ID của upload
   * @returns Thông tin về file đã upload
   */
  async completeUpload(uploadId: string) {
    try {
      console.log(`Hoàn thành upload ${uploadId}`);
      
      const response = await axios.post(
        `${this.baseUrl}/uploads/${uploadId}/complete`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi hoàn thành upload ${uploadId}:`, error.response?.data || error.message);
      throw new Error(`Lỗi khi hoàn thành upload: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Upload file lên OpenAI
   * @param filePath Đường dẫn đến file cần upload
   * @param purpose Mục đích của file (assistants)
   * @returns Thông tin về file đã upload
   */
  async uploadFile(filePath: string, purpose: string = 'assistants') {
    try {
      // Đọc file và lấy thông tin
      if (!fs.existsSync(filePath)) {
        throw new Error(`File không tồn tại: ${filePath}`);
      }
      
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;
      const fileName = path.basename(filePath);
      const fileBuffer = fs.readFileSync(filePath);
      
      console.log(`Bắt đầu upload file ${fileName} (${fileSize} bytes)`);
      
      // Kiểm tra API key
      if (!this.apiKey || this.apiKey.length < 20) {
        console.error('API key không hợp lệ hoặc thiếu. Độ dài:', this.apiKey ? this.apiKey.length : 0);
        throw new Error('API key không hợp lệ hoặc chưa được cấu hình');
      }
      
      try {
        // Phương pháp đơn giản hơn: upload file trực tiếp
        console.log(`Thử phương pháp upload file trực tiếp...`);
        
        const formData = new FormData();
        formData.append('purpose', purpose);
        formData.append('file', new Blob([fileBuffer]), fileName);
        
        const response = await axios.post(
          `${this.baseUrl}/files`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        console.log(`Upload file ${fileName} thành công, file ID: ${response.data.id}`);
        return response.data;
      } catch (directUploadError: any) {
        console.error('Lỗi khi upload trực tiếp:', directUploadError.message);
        if (directUploadError.response) {
          console.error('Response status:', directUploadError.response.status);
          console.error('Response data:', directUploadError.response.data);
        }
        
        // Tiếp tục với phương pháp upload phân đoạn
        console.log(`Thử phương pháp upload file phân đoạn...`);
        
        // Tạo upload mới
        const uploadData = await this.createUpload(purpose, fileSize, fileName);
        const uploadId = uploadData.id;
        
        // Kích thước mỗi phần (10MB)
        const PART_SIZE = 10 * 1024 * 1024;
        
        // Tính số phần cần upload
        const numParts = Math.ceil(fileSize / PART_SIZE);
        console.log(`Chia file thành ${numParts} phần`);
        
        // Upload từng phần
        for (let i = 0; i < numParts; i++) {
          const start = i * PART_SIZE;
          const end = Math.min(start + PART_SIZE, fileSize);
          const partData = fileBuffer.slice(start, end);
          const partNumber = i + 1;
          
          await this.addUploadPart(uploadId, partData, partNumber);
          console.log(`Đã upload phần ${partNumber}/${numParts}`);
        }
        
        // Hoàn thành upload
        const fileData = await this.completeUpload(uploadId);
        console.log(`Upload file ${fileName} hoàn tất, file ID: ${fileData.id}`);
        
        return fileData;
      }
    } catch (error: any) {
      console.error('Lỗi khi upload file:', error.message);
      throw new Error(`Lỗi khi upload file: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách các mô hình AI từ OpenAI
   */
  async getModels() {
    try {
      // Gọi API của OpenAI để lấy danh sách models
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.data) {
        // Lấy tất cả models từ API
        const allModels = response.data.data;
        
        // Lọc các model chat/completion - thường có các từ khóa sau trong ID
        const chatKeywords = ['gpt', 'chat', 'completions', 'turbo'];
        
        // Danh sách tiền tố của model không phải chat/completion để loại bỏ
        const nonChatPrefixes = ['text-', 'whisper-', 'tts-', 'dall-e', 'embedding'];
        
        // Lọc các model chat/completion
        const filteredModels = allModels
          .filter((model: ModelResponse) => {
            const modelId = model.id.toLowerCase();
            
            // Loại bỏ các model không phải chat/completion
            for (const prefix of nonChatPrefixes) {
              if (modelId.startsWith(prefix)) return false;
            }
            
            // Kiểm tra xem có phải là model chat/completion không
            let isChatModel = false;
            for (const keyword of chatKeywords) {
              if (modelId.includes(keyword)) {
                isChatModel = true;
                break;
              }
            }
            
            return isChatModel;
          });
          
        // Gom nhóm các model cùng loại
        const groupedModels = this.groupSimilarModels(filteredModels);
        
        // Chuyển đổi sang định dạng ứng dụng và sắp xếp
        const mappedModels = groupedModels.map((model: ModelResponse) => ({
          id: model.id,
          name: this.formatModelName(model.id),
          description: this.getModelDescription(model.id)
        }));
        
        // Sắp xếp các model theo thứ tự ưu tiên
        const sortedModels = this.sortModelsByPriority(mappedModels);
        
        // Nếu có ít nhất một model, trả về danh sách
        if (sortedModels.length > 0) {
          console.log(`Lấy được ${sortedModels.length} models từ OpenAI API (đã gom nhóm từ ${filteredModels.length} models)`);
          return sortedModels;
        }
      }
      
      // Trả về danh sách dự phòng nếu API không trả về dữ liệu hoặc không có models phù hợp
      console.log('Không tìm thấy model chat từ API, sử dụng danh sách dự phòng');
      return [
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Model mạnh nhất của OpenAI với khả năng multimodal' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Phiên bản cải tiến của GPT-4 với hiệu suất cao' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Model cân bằng giữa hiệu suất và chi phí' }
      ];
    } catch (error) {
      console.error('Lỗi khi lấy danh sách models OpenAI:', error);
      
      // Trả về danh sách cứng nếu API gặp lỗi
      return [
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Model mạnh nhất của OpenAI với khả năng multimodal' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Model cân bằng giữa hiệu suất và chi phí' }
      ];
    }
  }

  /**
   * Gom nhóm các model tương tự nhau để tránh tràn danh sách
   */
  private groupSimilarModels(models: ModelResponse[]): ModelResponse[] {
    // Các nhóm model ưu tiên cần giữ lại model mới nhất
    const modelGroups: { [key: string]: ModelResponse[] } = {};
    
    for (const model of models) {
      // Xác định nhóm của model dựa trên tên base (bỏ timestamp, version...)
      const baseModelName = this.getBaseModelName(model.id);
      
      if (!modelGroups[baseModelName]) {
        modelGroups[baseModelName] = [];
      }
      
      modelGroups[baseModelName].push(model);
    }
    
    // Lấy model mới nhất từ mỗi nhóm (dựa trên timestamp hoặc version nếu có)
    const latestModels: ModelResponse[] = [];
    
    for (const [baseModelName, modelList] of Object.entries(modelGroups)) {
      if (modelList.length > 0) {
        // Sắp xếp model trong nhóm dựa trên created date nếu có, hoặc dựa trên timestamp trong id
        modelList.sort((a, b) => {
          // Ưu tiên sắp xếp theo created date từ API nếu có
          if (a.created && b.created) {
            return b.created - a.created;
          }
          
          // Nếu không có created date, thử sắp xếp theo timestamp trong ID
          const timestampA = this.extractTimestampFromId(a.id);
          const timestampB = this.extractTimestampFromId(b.id);
          
          if (timestampA && timestampB) {
            return timestampB.localeCompare(timestampA);
          }
          
          // Nếu không có cách nào để so sánh, ưu tiên ID ngắn hơn
          return a.id.length - b.id.length;
        });
        
        // Thêm model mới nhất từ mỗi nhóm
        latestModels.push(modelList[0]);
      }
    }
    
    return latestModels;
  }
  
  /**
   * Trích xuất tên cơ bản của model, bỏ qua timestamp và version
   */
  private getBaseModelName(modelId: string): string {
    // Chuyển sang chữ thường để xử lý nhất quán
    const lowerModelId = modelId.toLowerCase();
    
    // Loại bỏ timestamp và các phần phụ
    let baseModelName = lowerModelId
      .replace(/-\d{8}$/, '')  // Loại bỏ -YYYYMMDD ở cuối
      .replace(/-\d{4,}$/, '')  // Loại bỏ -YYYY hoặc -MMDD ở cuối
      .replace(/-\d{4}-\d{2}-\d{2}$/, '')  // Loại bỏ -YYYY-MM-DD ở cuối
      .replace(/-preview.*$/, '')  // Loại bỏ -preview... ở cuối
      .replace(/ \d{4} \d{2} \d{2}$/, '')  // Loại bỏ YYYY MM DD ở cuối
      .replace(/-\d{4} \d{2} \d{2}$/, ''); // Loại bỏ -YYYY MM DD ở cuối
      
    // Xử lý tên model
    if (baseModelName.startsWith('chatgpt-')) {
      // Chuyển chatgpt- thành gpt-
      baseModelName = baseModelName.replace('chatgpt-', 'gpt-');
    }
    
    // Trích xuất phiên bản chính của model (gpt-4, gpt-3.5-turbo, v.v)
    const modelPatterns = [
      // Mẫu regex cho các model phổ biến
      { pattern: /gpt-4o/, base: 'gpt-4o' },
      { pattern: /gpt-4.*vision/, base: 'gpt-4-vision' },
      { pattern: /gpt-4.*turbo/, base: 'gpt-4-turbo' },
      { pattern: /gpt-4.*32k/, base: 'gpt-4-32k' },
      { pattern: /gpt-4/, base: 'gpt-4' },
      { pattern: /gpt-3\.5.*turbo.*16k/, base: 'gpt-3.5-turbo-16k' },
      { pattern: /gpt-3\.5.*turbo/, base: 'gpt-3.5-turbo' }
    ];
    
    // Kiểm tra theo từng mẫu, theo thứ tự ưu tiên
    for (const {pattern, base} of modelPatterns) {
      if (pattern.test(baseModelName)) {
        return base;
      }
    }
    
    // Nếu không khớp với bất kỳ mẫu nào, trả về tên model đã được làm sạch
    return baseModelName;
  }
  
  /**
   * Trích xuất timestamp từ ID model (nếu có)
   */
  private extractTimestampFromId(modelId: string): string | null {
    // Tìm timestamp theo định dạng YYYYMMDD
    const timestampMatch = modelId.match(/(\d{8}|\d{4}-\d{2}-\d{2}|\d{4} \d{2} \d{2})/);
    return timestampMatch ? timestampMatch[1] : null;
  }

  /**
   * Sắp xếp models theo thứ tự ưu tiên (các model mới và mạnh nhất lên đầu)
   */
  private sortModelsByPriority(models: any[]): any[] {
    // Danh sách từ khóa ưu tiên trong tên model, theo thứ tự giảm dần
    const priorityKeywords = [
      'gpt-4o', 
      'gpt-4-turbo', 
      'gpt-4-vision',
      'gpt-4',
      'gpt-3.5-turbo'
    ];
    
    return models.sort((a, b) => {
      // Xác định độ ưu tiên dựa trên danh sách ưu tiên
      let priorityA = priorityKeywords.length;
      let priorityB = priorityKeywords.length;
      
      for (let i = 0; i < priorityKeywords.length; i++) {
        if (a.id.includes(priorityKeywords[i])) {
          priorityA = i;
          break;
        }
      }
      
      for (let i = 0; i < priorityKeywords.length; i++) {
        if (b.id.includes(priorityKeywords[i])) {
          priorityB = i;
          break;
        }
      }
      
      // Nếu cùng độ ưu tiên, ưu tiên tên ngắn hơn (thường là model mới nhất)
      if (priorityA === priorityB) {
        // Loại bỏ ngày tháng và phiên bản khỏi tên (như -0613)
        const nameA = a.id.replace(/-\d{4,}$/, '');
        const nameB = b.id.replace(/-\d{4,}$/, '');
        return nameA.length - nameB.length;
      }
      
      return priorityA - priorityB;
    });
  }

  /**
   * Định dạng tên hiển thị cho model dựa trên ID
   */
  private formatModelName(modelId: string): string {
    // Sử dụng tên base thay vì xử lý toàn bộ ID
    const baseModelName = this.getBaseModelName(modelId);
    
    // Áp dụng rules định dạng tự động
    const formattingRules: [RegExp, string | ((matches: RegExpMatchArray) => string)][] = [
      // Thay thế gpt-4o thành GPT-4o
      [/^gpt-4o$/, 'GPT-4o'],
      
      // Thay thế gpt-4-vision thành GPT-4 Vision
      [/^gpt-4-vision$/, 'GPT-4 Vision'],
      
      // Thay thế gpt-4-turbo thành GPT-4 Turbo
      [/^gpt-4-turbo$/, 'GPT-4 Turbo'],
      
      // Thay thế gpt-4-32k thành GPT-4 32K
      [/^gpt-4-32k$/, 'GPT-4 32K'],
      
      // Thay thế gpt-4 thành GPT-4
      [/^gpt-4$/, 'GPT-4'],
      
      // Xử lý các phiên bản gpt-3.5-turbo
      [/^gpt-3\.5-turbo-16k$/, 'GPT-3.5 Turbo 16K'],
      [/^gpt-3\.5-turbo$/, 'GPT-3.5 Turbo'],
      
      // Format chung cho các model khác - pattern + replacement function
      [/(gpt|chatgpt|chat)-?([0-9.]+)?-?(.*)/, (matches: RegExpMatchArray) => {
        const prefix = matches[1]?.toUpperCase() || 'GPT';
        const version = matches[2] ? ` ${matches[2]}` : '';
        let suffix = matches[3] ? ` ${matches[3]}` : '';
        
        // Xử lý suffix
        suffix = suffix.replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return `${prefix}${version}${suffix}`;
      }]
    ];
    
    // Áp dụng rule đầu tiên khớp
    for (const [pattern, replacement] of formattingRules) {
      if (pattern.test(baseModelName)) {
        if (typeof replacement === 'string') {
          return replacement;
        } else {
          const matches = baseModelName.match(pattern);
          if (matches) {
            return replacement(matches);
          }
        }
        break;
      }
    }
    
    // Xử lý mặc định nếu không khớp rule nào
    return baseModelName
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/Gpt/g, 'GPT')
      .replace(/Chatgpt/g, 'ChatGPT');
  }

  /**
   * Tạo mô tả cho model dựa trên ID
   */
  private getModelDescription(modelId: string): string {
    // Sử dụng base model name để chuẩn hóa
    const baseModelName = this.getBaseModelName(modelId);
    
    // Sử dụng map các mô tả dựa trên đặc điểm model
    const descriptionPatterns: [RegExp, string][] = [
      [/gpt-4o/, 'Model mạnh nhất của OpenAI với khả năng multimodal'],
      [/gpt-4.*vision/, 'Model GPT-4 với khả năng xử lý hình ảnh'],
      [/gpt-4.*turbo/, 'Phiên bản cải tiến của GPT-4 với hiệu suất cao'],
      [/gpt-4.*32k/, 'Model GPT-4 với ngữ cảnh mở rộng 32K tokens'],
      [/gpt-4/, 'Model mạnh mẽ với khả năng suy luận và xử lý nhiệm vụ phức tạp'],
      [/gpt-3\.5.*turbo.*16k/, 'Model GPT-3.5 với ngữ cảnh mở rộng 16K tokens'],
      [/gpt-3\.5.*turbo/, 'Model cân bằng giữa hiệu suất và chi phí']
    ];
    
    // Kiểm tra pattern khớp đầu tiên
    for (const [pattern, description] of descriptionPatterns) {
      if (pattern.test(baseModelName)) {
        return description;
      }
    }
    
    // Mô tả chung dựa trên tên model nếu không có mô tả cụ thể
    if (baseModelName.includes('gpt')) {
      return `Model GPT của OpenAI`;
    }
    
    return `OpenAI Model ${modelId}`;
  }

  /**
   * Lấy thông tin chi tiết và giới hạn của một model
   */
  async getModelLimits(modelId: string) {
    try {
      // Thử lấy thông tin chi tiết từ API OpenAI
      const response = await axios.get(`${this.baseUrl}/models/${modelId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Thông tin giới hạn mặc định cho các model
      const modelDefaults: { [key: string]: any } = {
        'gpt-4o': { maxTokens: 4096, contextWindow: 128000 },
        'gpt-4-turbo': { maxTokens: 4096, contextWindow: 128000 },
        'gpt-3.5-turbo': { maxTokens: 4096, contextWindow: 16385 }
      };
      
      // Lấy thông tin contextWindow từ phản hồi API hoặc sử dụng giá trị mặc định
      const modelData = response.data;
      const contextWindow = this.extractContextWindowFromAPI(modelData) || 
                           this.getDefaultContextWindow(modelId);
      
      // Trả về thông tin model
      return {
        maxTokens: 4096, // OpenAI giới hạn cố định cho output tokens
        contextWindow: contextWindow,
        name: this.formatModelName(modelId),
        description: this.getModelDescription(modelId)
      };
    } catch (error: any) {
      console.error(`Lỗi khi lấy thông tin model ${modelId}:`, error);
      console.log('Sử dụng thông tin mặc định cho model');
      
      // Sử dụng giá trị mặc định nếu API gặp lỗi
      return {
        maxTokens: 4096,
        contextWindow: this.getDefaultContextWindow(modelId),
        name: this.formatModelName(modelId),
        description: this.getModelDescription(modelId)
      };
    }
  }
  
  /**
   * Trích xuất giới hạn context window từ phản hồi API
   */
  private extractContextWindowFromAPI(modelData: any): number | null {
    try {
      // Thử đọc thông tin context length từ phản hồi API
      // Các phiên bản API khác nhau có thể có cấu trúc khác nhau
      if (modelData.context_window) {
        return modelData.context_window;
      } else if (modelData.limits && modelData.limits.context_window) {
        return modelData.limits.context_window;
      } else if (modelData.capabilities && modelData.capabilities.context_window) {
        return modelData.capabilities.context_window;
      }
      return null;
    } catch (error) {
      console.error('Lỗi khi trích xuất context window:', error);
      return null;
    }
  }
  
  /**
   * Trả về giới hạn context window mặc định dựa trên ID model
   */
  private getDefaultContextWindow(modelId: string): number {
    // Sử dụng base model name để chuẩn hóa
    const baseModelName = this.getBaseModelName(modelId);
    
    // Các mẫu regex và giá trị context window tương ứng
    const contextWindowPatterns: [RegExp, number][] = [
      [/gpt-4o/, 128000],
      [/gpt-4.*turbo/, 128000],
      [/gpt-4.*32k/, 32768],
      [/gpt-4/, 8192],
      [/gpt-3\.5.*turbo.*16k/, 16385],
      [/gpt-3\.5.*turbo/, 4096]
    ];
    
    // Kiểm tra pattern khớp đầu tiên
    for (const [pattern, contextSize] of contextWindowPatterns) {
      if (pattern.test(baseModelName)) {
        return contextSize;
      }
    }
    
    // Giá trị mặc định an toàn
    return 4096;
  }

  /**
   * Lấy thông tin về file đã upload
   * @param fileId ID của file
   */
  async getFile(fileId: string) {
    try {
      console.log(`Lấy thông tin về file ${fileId}`);
      
      const response = await axios.get(
        `${this.baseUrl}/files/${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi lấy thông tin về file ${fileId}:`, error.response?.data || error.message);
      throw new Error(`Lỗi khi lấy thông tin file: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Gửi tin nhắn đến OpenAI và nhận phản hồi, có hỗ trợ file đã upload
   * @param prompt Nội dung tin nhắn
   * @param modelId ID của model
   * @param attachmentPath Đường dẫn đến file đính kèm (ảnh)
   * @param fileIds Danh sách ID các file đã upload
   * @param conversationHistory Lịch sử hội thoại
   * @param contextSummary Tóm tắt ngữ cảnh
   */
  async sendMessage(
    prompt: string, 
    modelId: string, 
    attachmentPath?: string, 
    fileIds?: string[], 
    conversationHistory?: any[], 
    contextSummary?: string
  ) {
    try {
      console.log(`Gửi tin nhắn đến OpenAI với model: ${modelId}`);
      
      // Kiểm tra và xử lý fileIds
      let validFileIds: string[] = [];
      if (fileIds) {
        // Đảm bảo fileIds là mảng
        if (typeof fileIds === 'string') {
          try {
            // Thử phân tích chuỗi JSON
            validFileIds = JSON.parse(fileIds);
          } catch (e) {
            // Nếu không phải JSON, xem như là một ID duy nhất
            validFileIds = [fileIds];
          }
        } else if (Array.isArray(fileIds)) {
          validFileIds = fileIds;
        }
        
        if (validFileIds.length > 0) {
          console.log(`Đính kèm ${validFileIds.length} file với tin nhắn: ${validFileIds.join(', ')}`);
        }
      }
      
      // Lấy thông tin giới hạn model
      let maxTokens;
      try {
        const modelLimits = await this.getModelLimits(modelId);
        maxTokens = Math.min(4096, modelLimits.maxTokens);
        console.log(`Model ${modelId} có giới hạn: ${maxTokens} tokens`);
      } catch (error) {
        maxTokens = 4096;
        console.log(`Sử dụng giới hạn mặc định: ${maxTokens} tokens`);
      }

      const messages: Message[] = [];
      
      // Thêm context summary nếu có
      if (contextSummary) {
        messages.push({
          role: 'system',
          content: contextSummary
        });
      } else {
        // Thêm system message mặc định
        messages.push({
          role: 'system',
          content: 'Bạn là một trợ lý AI hữu ích.'
        });
      }
      
      // Thêm lịch sử hội thoại nếu có
      if (conversationHistory && conversationHistory.length > 0) {
        // Chuyển đổi định dạng tin nhắn nếu cần
        const formattedHistory = conversationHistory.map(msg => ({
          role: msg.is_user ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
        messages.push(...formattedHistory);
      }

      // Tin nhắn từ người dùng
      let userMessage: any = {
        role: 'user',
        content: prompt
      };

      // Nếu có file đính kèm (ảnh), thêm vào tin nhắn
      if (attachmentPath) {
        console.log(`Xử lý file đính kèm: ${attachmentPath}`);
        
        if (!fs.existsSync(attachmentPath)) {
          console.error(`File không tồn tại: ${attachmentPath}`);
          throw new Error(`File không tồn tại: ${attachmentPath}`);
        }

        // Chỉ xử lý nếu model hỗ trợ vision (gpt-4-vision, gpt-4o)
        if (modelId.includes('gpt-4o') || modelId.includes('gpt-4-vision')) {
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
              default:
                throw new Error(`Định dạng file ${extension} không được hỗ trợ`);
            }

            // Đọc file dưới dạng Buffer và chuyển sang base64
            const fileContent = fs.readFileSync(attachmentPath);
            const base64Content = fileContent.toString('base64');
            
            console.log(`Kích thước file: ${(fileContent.length / (1024 * 1024)).toFixed(2)}MB`);

            // Format theo quy định của OpenAI
            const contentArray: any[] = [
              { type: 'text', text: prompt },
              { 
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${base64Content}`
                }
              }
            ];

            userMessage.content = contentArray;
          } catch (fileError: any) {
            console.error(`Lỗi xử lý file: ${fileError.message}`);
            throw new Error(`Lỗi xử lý file: ${fileError.message}`);
          }
        } else {
          console.warn(`Model ${modelId} không hỗ trợ xử lý hình ảnh, bỏ qua file đính kèm`);
        }
      }

      // Thêm file vào payload nếu có, sử dụng attachments theo tài liệu mới nhất
      if (validFileIds && validFileIds.length > 0) {
        try {
          // Sử dụng attachments để kèm file
          console.log(`Thử sử dụng attachments với file_ids...`);
          
          // Tạo mảng attachments theo định dạng yêu cầu
          const attachments = validFileIds.map(fileId => ({
            file_id: fileId,
            type: "file"
          }));
          
          // Thêm attachments vào message nội dung của user
          if (typeof userMessage.content === 'string') {
            userMessage.content = [
              { type: "text", text: userMessage.content },
              ...attachments.map(attachment => ({ 
                type: "file",
                file_id: attachment.file_id
              }))
            ];
          } else if (Array.isArray(userMessage.content)) {
            // Nếu đã là mảng (có thể đã có hình ảnh), thêm các file vào
            userMessage.content.push(...attachments.map(attachment => ({ 
              type: "file",
              file_id: attachment.file_id
            })));
          }
          
          console.log(`Đã thêm ${validFileIds.length} file vào nội dung tin nhắn người dùng`);
        } catch (attachmentSetupError) {
          console.error('Lỗi khi thiết lập file attachments:', attachmentSetupError);
        }
      }

      // Thêm tin nhắn người dùng (đã có thể bao gồm file attachments) vào messages
      messages.push(userMessage);
      
      const requestPayload: any = {
        model: modelId,
        messages: messages
      };

      console.log('Gửi tin nhắn đến OpenAI API:');
      console.log('Tổng số tin nhắn:', messages.length);
      
      // Kiểm tra loại model để áp dụng tham số phù hợp
      const baseModelName = this.getBaseModelName(modelId).toLowerCase();
      
      // Áp dụng các tham số dựa trên loại model
      if (
        baseModelName.includes('gpt-3.5') || 
        baseModelName.includes('gpt-4') || 
        baseModelName.includes('gpt-4o')
      ) {
        // Các model hỗ trợ chat completion thường hỗ trợ các tham số này
        requestPayload.max_tokens = maxTokens;
        
        // Một số model mới (đặc biệt là gpt-4o) có thể không hỗ trợ temperature
        // Chỉ thêm temperature nếu model hỗ trợ
        if (
          !baseModelName.includes('gpt-4o-2024') && 
          !baseModelName.includes('gpt-4o-mini')
        ) {
          requestPayload.temperature = 0.7;
        }
      }

      // Gửi tin nhắn đến OpenAI API
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Xử lý phản hồi từ API
      const responseData = response.data;
      const content = responseData.choices[0]?.message?.content || '';

      return {
        content,
        model: modelId,
        id: responseData.id
      };
    } catch (error: any) {
      console.error('Lỗi khi gửi tin nhắn đến OpenAI:', error.response?.data || error.message);
      
      // Nếu lỗi liên quan đến tham số không hỗ trợ
      if (error.response?.data?.error?.message?.includes('Unrecognized request argument') ||
          error.response?.data?.error?.message?.includes('incompatible request argument')) {
        try {
          console.log('Thử lại yêu cầu không có file...');
          
          // Xác định lại messages từ userMessage 
          const retryMessages = [
            { role: 'system', content: 'Bạn là một trợ lý AI hữu ích. Người dùng đã tải lên một file, nhưng bạn không thể truy cập nội dung file đó trực tiếp. Hãy thông báo với người dùng về điều này.' },
            { role: 'user', content: `${prompt} (Tôi đã đính kèm một file để bạn đọc)` }
          ];
          
          // Gửi lại với tham số đơn giản, không có file_ids
          const simpleResponse = await axios.post(
            `${this.baseUrl}/chat/completions`,
            {
              model: modelId,
              messages: retryMessages,
              temperature: 0.7,
              max_tokens: 4096 // Sử dụng giá trị cố định thay vì biến maxTokens
            },
            {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const simpleData = simpleResponse.data;
          const simpleContent = simpleData.choices[0]?.message?.content || '';
          
          return {
            content: simpleContent,
            model: modelId,
            id: simpleData.id
          };
        } catch (retryError: any) {
          console.error('Vẫn lỗi khi gửi lại tin nhắn đơn giản:', retryError.response?.data || retryError.message);
          throw new Error(`Lỗi khi gửi tin nhắn đến OpenAI: ${retryError.response?.data?.error?.message || retryError.message}`);
        }
      }
      
      throw new Error(`Lỗi khi gửi tin nhắn đến OpenAI: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Liệt kê các file đã upload
   * @param purpose Mục đích của file (assistants)
   */
  async listFiles(purpose?: string) {
    try {
      console.log('Lấy danh sách các file đã upload');
      
      let url = `${this.baseUrl}/files`;
      if (purpose) {
        url += `?purpose=${purpose}`;
      }
      
      const response = await axios.get(
        url,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách files:', error.response?.data || error.message);
      throw new Error(`Lỗi khi lấy danh sách files: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Xóa file đã upload
   * @param fileId ID của file cần xóa
   */
  async deleteFile(fileId: string) {
    try {
      console.log(`Xóa file ${fileId}`);
      
      const response = await axios.delete(
        `${this.baseUrl}/files/${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi xóa file ${fileId}:`, error.response?.data || error.message);
      throw new Error(`Lỗi khi xóa file: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Lấy nội dung của file đã upload
   * @param fileId ID của file
   */
  async retrieveFileContent(fileId: string) {
    try {
      console.log(`Lấy nội dung file ${fileId}`);
      
      const response = await axios.get(
        `${this.baseUrl}/files/${fileId}/content`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi lấy nội dung file ${fileId}:`, error.response?.data || error.message);
      throw new Error(`Lỗi khi lấy nội dung file: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

export default new OpenAIService(); 