// ============================================================
// api/index.js — Axios instance
// ============================================================
// WHY a custom axios instance instead of plain fetch?
// 1. We configure the base URL once — all calls use it automatically
// 2. The request interceptor attaches the JWT token to EVERY request
//    automatically — you don't write the Authorization header each time
// 3. The response interceptor handles 401 errors globally —
//    if token expires, user is logged out automatically everywhere
//
// This is the "Don't Repeat Yourself" (DRY) principle.
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:5000 in dev
});

// ── Request interceptor ───────────────────────────────────
// Runs before EVERY request is sent.
// Reads the token from localStorage and adds it to the header.
// This means every protected API call automatically sends the JWT.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────
// Runs after EVERY response is received.
// If server returns 401 (token expired/invalid), clear localStorage
// and redirect to login page. This handles session expiry automatically.
api.interceptors.response.use(
  (response) => response, // success — just pass through
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;