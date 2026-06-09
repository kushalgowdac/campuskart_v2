// routes/notifications.js
import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// All notification routes require login
router.get('/',               verifyToken, getNotifications);
router.patch('/read-all',     verifyToken, markAllAsRead);
router.patch('/:id/read',     verifyToken, markAsRead);

export default router;