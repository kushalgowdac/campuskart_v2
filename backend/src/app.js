// ============================================================
// app.js — Express application entry point
// ============================================================
// This is the first file Node.js runs. It:
//   1. Creates the Express app
//   2. Registers global middleware (CORS, JSON parsing)
//   3. Mounts all route files under their URL prefixes
//   4. Adds a global error handler at the bottom
//   5. Starts listening on a port
//   6. Starts the cleanup background job
//
// Think of this as the "main()" of your backend.
// It wires everything together but contains no business logic itself.
// ============================================================

import dotenv from 'dotenv';
dotenv.config(); // Load .env file FIRST — before anything else imports env vars

import express from 'express';
import cors from 'cors';

// Import all route files
import authRouter          from './routes/auth.js';
import productsRouter      from './routes/products.js';
import adminRouter         from './routes/admin.js';
import contactRouter       from './routes/contact.js';
import notificationsRouter from './routes/notifications.js';

// Import background job
import { startCleanupJob } from './jobs/cleanup.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// GLOBAL MIDDLEWARE
// Middleware registered here runs on EVERY request before routes.
// Order matters — they run top to bottom.
// ============================================================

// ── CORS ──────────────────────────────────────────────────────
// CORS = Cross-Origin Resource Sharing
// By default, browsers block requests from one domain to another.
// (e.g. your React app on campuskart.vercel.app calling your API
//  on campuskart-api.onrender.com would be blocked)
// This middleware adds response headers that tell the browser: "it's okay".
//
// In production: replace '*' with your actual frontend URL.
// '*' means any domain can call your API — fine for dev, risky for prod.
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── JSON Body Parser ──────────────────────────────────────────
// Without this, req.body would be undefined.
// Express needs to be told to parse incoming JSON bodies.
// limit: '10mb' allows base64-encoded images in the request body.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// HEALTH CHECK
// A simple GET / that returns 200 OK.
// Render and Vercel use this to know your server is alive.
// Uptime monitors (UptimeRobot) ping this to keep Render awake.
// ============================================================
app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    message: 'CampusKart API v2 is running',
    time:    new Date().toISOString(),
  });
});

// ============================================================
// ROUTES
// app.use('/api/products', productsRouter) means:
//   Any request starting with /api/products goes to productsRouter.
//   Inside productsRouter, routes are defined relative to that prefix.
//   So router.get('/mine') handles GET /api/products/mine
// ============================================================
app.use('/api/auth',          authRouter);
app.use('/api/products',      productsRouter);
app.use('/api/admin',         adminRouter);
app.use('/api/contact',       contactRouter);
app.use('/api/notifications', notificationsRouter);

// ============================================================
// 404 HANDLER
// If no route matched, return a 404.
// This must come AFTER all route registrations.
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// In Express, a function with 4 parameters (err, req, res, next)
// is treated as an error handler.
// When any controller calls next(err), execution jumps here.
// This catches unhandled errors so the server doesn't crash.
// ============================================================
app.use((err, req, res, next) => {
  console.error('[Server Error]', {
    path:    req.originalUrl,
    method:  req.method,
    message: err?.message,
    stack:   process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   CampusKart API v2 running on :${PORT}    ║
║   http://localhost:${PORT}                  ║
╚══════════════════════════════════════════╝
  `);
});

// Start the 90-day cleanup background job
startCleanupJob();

export default app;