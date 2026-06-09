import { Router } from 'express';
import {
  listProducts,
  getMyProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStatus,
  deleteProduct,
} from '../controllers/productsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// ── Public routes ──
router.get('/',    listProducts);    // GET /api/products

// ── Protected routes ──
// IMPORTANT: /mine MUST come BEFORE /:id
// Otherwise Express matches 'mine' as the :id parameter and returns 404
router.get('/mine',          verifyToken, getMyProducts);   // GET /api/products/mine

// ── Parametric routes (after /mine) ──
router.get('/:id', getProductById); // GET /api/products/:id
router.post('/',             verifyToken, createProduct);   // POST /api/products
router.put('/:id',           verifyToken, updateProduct);   // PUT /api/products/:id
router.patch('/:id/status',  verifyToken, updateStatus);    // PATCH /api/products/:id/status
router.delete('/:id',        verifyToken, deleteProduct);   // DELETE /api/products/:id

export default router;