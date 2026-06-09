// ============================================================
// context/AuthContext.jsx — Global authentication state
// ============================================================
// WHY React Context?
// Multiple components need to know "who is logged in":
//   - Navbar: show Login button or user name
//   - ProtectedRoute: redirect to /login if not authenticated
//   - Sell page: get seller ID from logged-in user
//   - Admin page: check if user is admin
//
// Without Context, you'd have to pass user as a prop through every
// component — called "prop drilling". Context puts the user in a
// global store that any component can read directly.
//
// Think of it like a global variable, but React-aware (updates trigger re-renders).
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react';

// Step 1: Create the context object
// This is just an empty container — we fill it with the Provider below
const AuthContext = createContext(null);

// Step 2: Provider component — wraps the entire app
// Any component inside <AuthProvider> can access the auth state
export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage so login persists across page refreshes
  // JSON.parse because localStorage only stores strings, not objects
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // ── login ────────────────────────────────────────────────
  // Called after successful login or register API response.
  // Saves token + user to localStorage AND updates React state.
  // React state update triggers re-render of all subscribed components.
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // ── logout ───────────────────────────────────────────────
  // Clears everything. The axios interceptor also calls this on 401.
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Computed values — derived from user state
  const isLoggedIn = !!user;              // true if user is not null
  const isAdmin = user?.role === 'admin'; // true only for admin role

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

// Step 3: Custom hook for consuming the context
// Instead of writing useContext(AuthContext) everywhere,
// components just write: const { user, login, logout } = useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};