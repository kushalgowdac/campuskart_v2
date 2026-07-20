import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Browse from './pages/Browse';
import Login from './pages/Login';
import ProductDetail from './pages/ProductDetail';
import ContactSeller from './pages/ContactSeller';
import Sell from './pages/Sell';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Notifications from './pages/Notifications';
import Setup from './pages/Setup';
import Contribute from './pages/Contribute';

// ── Why ErrorBoundary wraps everything here ────────────────
// Placing it ONCE at the top level (inside BrowserRouter, outside Routes)
// means ANY page that throws a render error gets caught by this single
// boundary, instead of needing one per page. If a more specific page
// needs its own recovery behavior later, you can nest another
// ErrorBoundary around just that route.

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Browse />} />
            <Route path="/login" element={<Login />} />
            <Route path="/product/:id" element={<ProductDetail />} />

            {/* Protected — must be logged in */}
            <Route path="/contact/:productId" element={<ProtectedRoute><ContactSeller /></ProtectedRoute>} />
            <Route path="/sell" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/contribute" element={<ProtectedRoute><Contribute /></ProtectedRoute>} />
            <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />

            {/* Admin only */}
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

            {/* 404 — now uses design tokens instead of hardcoded blue */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--color-text-secondary)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Page not found
                </h2>
                <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                  The page you're looking for doesn't exist.
                </p>
                <a href="/" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                  Go home
                </a>
              </div>
            } />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;