// ============================================================
// middleware/auth.js — Supabase JWT verification
// ============================================================
// WHAT CHANGED from the old version:
// Old: we issued our own JWT using JWT_SECRET, verified with jsonwebtoken
// New: Supabase issues the JWT after Google OAuth, we verify it using
//      the Supabase client's built-in getUser() method.
//
// WHY this is better:
// - Supabase handles token signing, rotation, expiry automatically
// - We never touch passwords or bcrypt
// - Google verified the user's email ownership for us
//
// The interface is IDENTICAL to the old middleware:
//   - Sets req.user = { id, role }
//   - Controllers use req.user.id and req.user.role unchanged
// ============================================================

import { supabase } from '../db/supabase.js';

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // supabase.auth.getUser(token) validates the Supabase JWT cryptographically
    // and returns the Supabase auth user. This is the equivalent of jwt.verify().
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // The Supabase auth user has the email — look up our application user row
    // to get role, id (our UUID), and profile data.
    // We cannot use authUser.id directly because our users table uses its own UUIDs.
    const { data: appUser, error: dbError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', authUser.email)
      .single();

    if (dbError || !appUser) {
      return res.status(401).json({ error: 'User profile not found. Please log in again.' });
    }

    // Set req.user — same shape as before so all controllers work unchanged
    req.user = {
      id:   appUser.id,
      role: appUser.role,
    };

    next();
  } catch (err) {
    console.error('[verifyToken] error:', err.message);
    return res.status(401).json({ error: 'Token verification failed.' });
  }
};

// requireAdmin is IDENTICAL to the old version — no changes needed
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }
  next();
};