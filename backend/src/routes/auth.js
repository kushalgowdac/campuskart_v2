// ============================================================
// routes/auth.js
// ============================================================
// Routes are the URL patterns. They connect HTTP methods + paths
// to controller functions. The route file itself has no logic —
// it's a pure mapping table.
//
// Why separate routes from controllers?
// Single Responsibility Principle. Routes know about URLs.
// Controllers know about business logic. Mixing them makes
// both harder to read and test.
// ============================================================

import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Public routes — no auth needed
router.post('/register', register);
router.post('/login',    login);

// Protected routes — verifyToken middleware runs first
// If token is invalid, verifyToken sends 401 and controller never runs
router.get('/me',          verifyToken, getMe);
router.put('/profile',     verifyToken, updateProfile);

export default router;