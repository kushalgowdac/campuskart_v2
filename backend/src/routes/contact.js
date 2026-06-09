// routes/contact.js
import { Router } from 'express';
import {
  getContactHistory,
  getProductInterests,
  showInterest,
} from '../controllers/contactController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/history',                verifyToken, getContactHistory);
router.post('/:productId',             verifyToken, showInterest);
router.get('/:productId/interests',    verifyToken, getProductInterests);

export default router;
