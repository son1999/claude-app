import { Router } from 'express';
import chatRoutes from './chatRoutes';
import modelRoutes from './modelRoutes';
import fileRoutes from './fileRoutes';
// Sử dụng dynamic import để tránh TypeScript báo lỗi
const messageRoutes = require('./messageRoutes').default;

const router = Router();

// API routes
router.use('/chats', chatRoutes);
router.use('/models', modelRoutes);
router.use('/files', fileRoutes);
router.use('/', messageRoutes);

export default router; 