// ============================================================
// pages/Login.jsx — Google OAuth only
// ============================================================
// WHAT CHANGED: the entire form is gone.
// One button: "Continue with Google"
// Supabase handles everything — popup → Google consent → redirect back.
// After redirect, AuthContext's onAuthStateChange fires automatically,
// calls syncUserProfile, backend checks @rvce.edu.in, sets user state.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, supabase } from '../context/AuthContext';

const Login = () => {
  const { isLoggedIn } = useAuth();
  const navigate       = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true });
  }, [isLoggedIn, navigate]);

  // Read error from sessionStorage — set by AuthContext when sync-user fails
  // (e.g. non-RVCE email). sessionStorage survives the OAuth redirect,
  // unlike custom events which are lost when the page remounts.
  useEffect(() => {
    const storedError = sessionStorage.getItem('auth-error');
    if (storedError) {
      setError(storedError);
      sessionStorage.removeItem('auth-error'); // show once, then clear
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          scopes: 'email profile',
        },
      });
      if (error) throw error;
      // Browser redirects to Google — code below never runs
    } catch (err) {
      setError(err.message || 'Failed to start Google login. Try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f9fafb',
    }}>
      <div style={{
        background: 'white', padding: '2.5rem', borderRadius: '16px',
        border: '1px solid #e5e7eb', width: '100%', maxWidth: '380px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🛒</div>
        <h1 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>
          CampusKart
        </h1>
        <p style={{ margin: '0 0 2rem', color: '#6b7280', fontSize: '14px' }}>
          RVCE's student marketplace
        </p>

        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px',
          padding: '10px 14px', marginBottom: '1.5rem', fontSize: '13px', color: '#1e40af',
        }}>
          🎓 Only <strong>@rvce.edu.in</strong> Google accounts are allowed.
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 16px',
            background: loading ? '#f3f4f6' : 'white',
            color: '#374151', border: '1px solid #e5e7eb', borderRadius: '10px',
            fontSize: '15px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#f9fafb'; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'white'; }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {loading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        {error && (
          <div style={{
            color: '#dc2626', fontSize: '13px', marginTop: '14px',
            padding: '10px 14px', background: '#fef2f2', borderRadius: '8px',
            border: '1px solid #fecaca',
          }}>
            ⚠️ {error}
          </div>
        )}

        <p style={{ marginTop: '1.5rem', fontSize: '12px', color: '#9ca3af' }}>
          By signing in you agree to use this platform responsibly.
        </p>
      </div>
    </div>
  );
};

export default Login;