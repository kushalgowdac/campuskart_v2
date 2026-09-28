import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth, supabase } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import MarketplaceGuideModal from './components/MarketplaceGuideModal';
import Browse from './pages/Browse';

const Login = lazy(() => import('./pages/Login'));
const Guide = lazy(() => import('./pages/Guide'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const ClosedDeals = lazy(() => import('./pages/ClosedDeals'));
const ContactSeller = lazy(() => import('./pages/ContactSeller'));
const Sell = lazy(() => import('./pages/Sell'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Setup = lazy(() => import('./pages/Setup'));
const Contribute = lazy(() => import('./pages/Contribute'));

const RouteFallback = () => (
  <div className="page">
    <div className="skeleton" style={{ height: '24px', width: '180px', marginBottom: '20px', borderRadius: '4px' }} />
    <div className="skeleton" style={{ height: '180px', width: '100%', borderRadius: 'var(--radius-lg)' }} />
  </div>
);

const WELCOME_SEEN_KEY = 'campuskart-welcome-seen-v2';

const SiteEntryGuide = () => {
  const { isLoggedIn } = useAuth();
  const [showGuide, setShowGuide] = useState(
    () => !sessionStorage.getItem(WELCOME_SEEN_KEY)
  );

  if (isLoggedIn || !showGuide) return null;

  const continueBrowsing = () => {
    sessionStorage.setItem(WELCOME_SEEN_KEY, 'true');
    setShowGuide(false);
  };

  const signInWithGoogle = async () => {
    sessionStorage.setItem(WELCOME_SEEN_KEY, 'true');
    setShowGuide(false);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin, scopes: 'email profile' },
      });
      if (error) throw error;
    } catch (error) {
      sessionStorage.setItem('auth-error', error.message || 'Failed to start Google login.');
      window.location.href = '/login';
    }
  };

  return (
    <MarketplaceGuideModal
      onAcknowledge={signInWithGoogle}
      onBrowse={continueBrowsing}
      actionLabel="Sign in with RVCE Google"
    />
  );
};

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
          <SiteEntryGuide />
          <Navbar />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            {/* Public */}
            <Route path="/" element={<Browse />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/login" element={<Login />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/closed-deals" element={<ClosedDeals />} />

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
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
