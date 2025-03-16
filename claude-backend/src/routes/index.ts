import { Router } from 'express';
import chatRoutes from './chatRoutes';
import modelRoutes from './modelRoutes';

const router = Router();

// API routes
router.use('/chats', chatRoutes);
router.use('/models', modelRoutes);

export default router; 