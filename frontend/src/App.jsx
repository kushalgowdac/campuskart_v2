import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';

// Route-based code splitting — each page loads only when navigated to
const Browse         = lazy(() => import('./pages/Browse'));
const Login          = lazy(() => import('./pages/Login'));
const ProductDetail  = lazy(() => import('./pages/ProductDetail'));
const ContactSeller  = lazy(() => import('./pages/ContactSeller'));
const Sell           = lazy(() => import('./pages/Sell'));
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Profile        = lazy(() => import('./pages/Profile'));
const Admin          = lazy(() => import('./pages/Admin'));
const Notifications  = lazy(() => import('./pages/Notifications'));

const PageLoader = () => (
  <div className="label-caps" style={{ textAlign: 'center', padding: '6rem', color: 'var(--muted-foreground)' }}>
    LOADING MODULE...
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
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

            {/* Admin only */}
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

            {/* 404 */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
                <h2>404 — Page not found</h2>
                <a href="/" style={{ color: '#1d4ed8' }}>Go home</a>
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
