// ============================================================
// api/index.js — Axios instance
// ============================================================
// This file is FUNCTIONALLY UNCHANGED from the old version.
// The token in localStorage is now a Supabase access_token
// instead of our custom JWT, but it's still stored under 'token'
// and sent as "Authorization: Bearer <token>" on every request.
// The backend's verifyToken middleware now verifies it via Supabase
// instead of jsonwebtoken, but the HTTP contract is identical.
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
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