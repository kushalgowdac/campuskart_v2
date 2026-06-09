// ============================================================
// middleware/auth.js — JWT verification middleware
// ============================================================
// WHAT is middleware?
// In Express, middleware is a function that runs BETWEEN receiving
// a request and sending a response. It has access to req, res, and next().
// Calling next() passes control to the next middleware or route handler.
// Calling res.status(401).json(...) stops the chain — route never runs.
//
// WHY JWT middleware?
// Every protected route (create listing, contact seller, etc.) needs
// to know WHO is making the request. The client sends their JWT token
// in the Authorization header. This middleware:
//   1. Extracts the token from the header
//   2. Verifies it wasn't tampered with (using JWT_SECRET)
//   3. Decodes it to get { id, role }
//   4. Sets req.user = { id, role } for the controller to use
//   5. If invalid/expired → returns 401, controller never runs
//
// FLOW:
// Request → auth middleware → req.user is set → controller runs
//                          ↘ invalid token → 401, stop here
// ============================================================

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// ── verifyToken ──────────────────────────────────────────────
// Apply to any route that requires login.
// After this runs, req.user = { id, role, iat, exp }
export const verifyToken = (req, res, next) => {
  // The standard way to send a token is in the Authorization header:
  // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  // We split on ' ' and take index 1 to get just the token string.
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. No token provided.',
      hint:  'Send Authorization: Bearer <your_token> in the request header.'
    });
  }

  try {
    // jwt.verify does two things:
    //   1. Checks the signature — was this token created by our server?
    //      (Uses JWT_SECRET. Anyone with a different secret gets rejected.)
    //   2. Checks expiry — is the token still valid? (We set 7d on login)
    // If both pass, it returns the decoded payload: { id, role, iat, exp }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach to req so every controller can access req.user.id and req.user.role
    // This is how controllers know WHO is making the request
    // without hitting the database on every single request.
    req.user = decoded;
    next(); // Proceed to the actual route handler
  } catch (err) {
    // TokenExpiredError: token is valid but older than 7 days
    // JsonWebTokenError: token was tampered with or malformed
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired. Please log in again.'
      });
    }
    return res.status(401).json({
      error: 'Invalid token.'
    });
  }
};

// ── requireAdmin ─────────────────────────────────────────────
// Apply AFTER verifyToken on admin-only routes.
// verifyToken runs first (sets req.user), then this checks the role.
// TWO separate middlewares = two separate concerns = clean code.
//
// Usage in routes:
//   router.patch('/:id/approve', verifyToken, requireAdmin, approveProduct);
//   First verifyToken runs, then requireAdmin, then approveProduct.
export const requireAdmin = (req, res, next) => {
  // verifyToken must have run before this — req.user must exist
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      // 401 = not authenticated (who are you?)
      // 403 = not authorised (I know who you are, but you can't do this)
      error: 'Forbidden. Admin privileges required.'
    });
  }

  next();
};