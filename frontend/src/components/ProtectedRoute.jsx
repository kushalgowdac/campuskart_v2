// ============================================================
// components/ProtectedRoute.jsx
// ============================================================
// WHY this component?
// React Router renders components based on URL.
// But some pages (/sell, /dashboard, /admin) should only be
// accessible to logged-in users. Without protection, anyone
// could navigate to /dashboard directly.
//
// ProtectedRoute wraps those pages. If user is not logged in,
// it redirects to /login instead of rendering the page.
// If logged in, it renders the page normally.
//
// Usage in App.jsx:
//   <Route path="/sell" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
// ============================================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    // Navigate component from react-router-dom redirects to /login
    // replace={true} replaces history entry so back button doesn't return here
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ============================================================
// components/AdminRoute.jsx
// ============================================================
// Same pattern as ProtectedRoute but adds an extra check:
// user must be logged in AND have role === 'admin'.
// Regular logged-in users get redirected to home page.
// ============================================================
export const AdminRoute = ({ children }) => {
  const { isLoggedIn, isAdmin } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};