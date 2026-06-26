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

// routes/auth.js
import { Router } from 'express';
import { syncUser, getMe, updateProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// sync-user is NOT protected by verifyToken — it's called right after
// Google login before we've verified the user has an app profile yet.
// It does its own token verification internally.
router.post('/sync-user', syncUser);

// Protected routes — verifyToken runs first
router.get('/me',      verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);

export default router;