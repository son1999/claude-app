import express from 'express';
import ModelsController from '../controllers/ModelsController';

const router = express.Router();

// Lấy danh sách các mô hình AI
router.get('/', ModelsController.getModels);

export default router; 