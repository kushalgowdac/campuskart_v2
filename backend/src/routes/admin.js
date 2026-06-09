// routes/admin.js
import { Router } from 'express';
import {
  getPendingProducts,
  getAllProducts,
  approveProduct,
  rejectProduct,
  getAnalytics,
} from '../controllers/adminController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ALL admin routes require BOTH middlewares — login AND admin role
// verifyToken runs first, sets req.user, then requireAdmin checks role
const adminGuard = [verifyToken, requireAdmin];

router.get('/products/pending',       ...adminGuard, getPendingProducts);
router.get('/products/all',           ...adminGuard, getAllProducts);
router.patch('/products/:id/approve', ...adminGuard, approveProduct);
router.patch('/products/:id/reject',  ...adminGuard, rejectProduct);
router.get('/analytics',              ...adminGuard, getAnalytics);

export default router;