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

  /**
   * Lấy thông tin chi tiết của một model
   */
  async getModelDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID model là bắt buộc'
        });
      }
      
      const modelDetails = await AnthropicService.getModelLimits(id);
      
      res.status(200).json({
        success: true,
        data: modelDetails
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi lấy thông tin model'
      });
    }
  }
}

export default new ModelsController(); 