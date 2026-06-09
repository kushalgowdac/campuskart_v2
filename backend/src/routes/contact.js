// routes/contact.js
import { Router } from 'express';
import { showInterest, getProductInterests } from '../controllers/contactController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/:productId',             verifyToken, showInterest);
router.get('/:productId/interests',    verifyToken, getProductInterests);

export default router;
