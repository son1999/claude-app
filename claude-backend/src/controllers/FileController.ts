import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import OpenAIService from '../services/OpenAIService';
import AnthropicService from '../services/AnthropicService';

class FileController {
  /**
   * Upload file lên OpenAI hoặc Anthropic
   */
  static async uploadFile(req: Request, res: Response) {
    try {
      console.log('Bắt đầu quá trình upload file');
      
      // Kiểm tra xem có file được tải lên không
      if (!req.file) {
        return res.status(400).json({ error: 'Không tìm thấy file nào được tải lên.' });
      }

      const file = req.file;
      const filePath = file.path;
      const originalName = file.originalname;
      const mimeType = file.mimetype;

      // Lấy provider từ request body hoặc header
      let provider = req.body?.provider || req.headers['x-provider'] || 'anthropic';
      // Đảm bảo provider là string
      provider = Array.isArray(provider) ? provider[0] : provider.toString();
      
      console.log(`Tải lên file ${originalName} cho provider: ${provider}`);

      // Kiểm tra loại file trước khi upload cho Anthropic
      if (provider === 'anthropic') {
        const supportedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
        ];

        if (!supportedMimeTypes.includes(mimeType)) {
          // Xóa file đã tải lên nếu không được hỗ trợ
          fs.unlinkSync(filePath);
          return res.status(400).json({
            error: `Định dạng file ${mimeType} không được hỗ trợ bởi Anthropic. Chỉ chấp nhận JPEG, PNG, GIF, WebP và PDF.`,
          });
        }
      }

      let result;

      if (provider === 'openai') {
        // Upload file lên OpenAI
        result = await OpenAIService.uploadFile(filePath, req.body?.purpose || 'assistants');
      } else if (provider === 'anthropic') {
        // Upload file lên Anthropic (nếu có)
        // Đây là placeholder, cần thêm chức năng tương ứng trong AnthropicService
        result = { id: 'not-implemented', message: 'Anthropic upload chưa được hỗ trợ' };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Provider không hợp lệ. Chỉ hỗ trợ "openai" hoặc "anthropic"'
        });
      }

      // Lưu thông tin file vào response
      res.status(200).json({
        success: true,
        data: {
          ...result,
          provider,
          originalName,
          localPath: filePath,
          mimeType
        }
      });
    } catch (error: any) {
      console.error('Lỗi khi upload file:', error);
      
      // Xóa file đã upload nếu xảy ra lỗi
      if (req.file && req.file.path) {
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (e) {
          console.error('Lỗi khi xóa file sau khi xảy ra lỗi:', e);
        }
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi upload file'
      });
    }
  }

  /**
   * Lấy danh sách các file đã upload
   */
  static async listFiles(req: Request, res: Response) {
    try {
      const { provider = 'openai', purpose } = req.query;

      let result;
      if (provider === 'openai') {
        result = await OpenAIService.listFiles(purpose as string);
      } else if (provider === 'anthropic') {
        // Placeholder cho Anthropic
        result = { data: [] };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Provider không hợp lệ. Chỉ hỗ trợ "openai" hoặc "anthropic"'
        });
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách file:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi lấy danh sách file'
      });
    }
  }

  /**
   * Lấy thông tin chi tiết của một file
   */
  static async getFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      const { provider = 'openai' } = req.query;

      let result;
      if (provider === 'openai') {
        result = await OpenAIService.getFile(fileId);
      } else if (provider === 'anthropic') {
        // Placeholder cho Anthropic
        result = { id: fileId, message: 'Anthropic get file chưa được hỗ trợ' };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Provider không hợp lệ. Chỉ hỗ trợ "openai" hoặc "anthropic"'
        });
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error(`Lỗi khi lấy thông tin file ${req.params.fileId}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi lấy thông tin file'
      });
    }
  }

  /**
   * Xóa file đã upload
   */
  static async deleteFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      const { provider = 'openai' } = req.query;

      let result;
      if (provider === 'openai') {
        result = await OpenAIService.deleteFile(fileId);
      } else if (provider === 'anthropic') {
        // Placeholder cho Anthropic
        result = { id: fileId, deleted: true, message: 'Anthropic delete file chưa được hỗ trợ' };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Provider không hợp lệ. Chỉ hỗ trợ "openai" hoặc "anthropic"'
        });
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error(`Lỗi khi xóa file ${req.params.fileId}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi xóa file'
      });
    }
  }
}

export default FileController; 