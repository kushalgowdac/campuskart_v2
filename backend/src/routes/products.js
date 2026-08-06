import { Router } from 'express';
import {
  listProducts,
  listClosedProducts,
  getMyProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateListingDetails,
  updateStatus,
  deleteProduct,
} from '../controllers/productsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// ── Public route ──
router.get('/',   listProducts);    // GET /api/products
router.get('/closed', listClosedProducts); // GET /api/products/closed
// ── Protected route ──
// IMPORTANT: named routes must come BEFORE /:id.
// Otherwise Express matches the route name as the :id parameter.
router.get('/mine',verifyToken, getMyProducts);   // GET /api/products/mine
// ── Public route ──
router.get('/:id', getProductById); // GET /api/products/:id

// ── Protected routes ──
router.post('/',             verifyToken, createProduct);   // POST /api/products
router.put('/:id',           verifyToken, updateProduct);   // PUT /api/products/:id
router.patch('/:id/details', verifyToken, updateListingDetails); // PATCH price/description
router.patch('/:id/status',  verifyToken, updateStatus);    // PATCH /api/products/:id/status
router.delete('/:id',        verifyToken, deleteProduct);   // DELETE /api/products/:id

export default router;
