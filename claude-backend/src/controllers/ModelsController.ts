import { Request, Response } from 'express';
import AnthropicService from '../services/AnthropicService';

class ModelsController {
  /**
   * Lấy danh sách các mô hình AI từ Anthropic
   */
  async getModels(req: Request, res: Response) {
    try {
      const models = await AnthropicService.getModels();
      
      res.status(200).json({
        success: true,
        data: models
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi lấy danh sách mô hình AI'
      });
    }
  }
}

export default new ModelsController(); 