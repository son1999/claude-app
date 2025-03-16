import { Router, RequestHandler } from 'express';
import ModelsController from '../controllers/ModelsController';

const router = Router();

// Lấy danh sách các mô hình AI
router.get('/', ModelsController.getModels as RequestHandler);

// Lấy thông tin chi tiết của một model
router.get('/details/:id', ModelsController.getModelDetails as RequestHandler);

export default router; 