import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, supabase } from '../context/AuthContext';
import Button from '../components/Button';

// ── Why this login page looks different from a typical form ──
// Most login pages show email + password fields because most apps
// use email/password auth. We use Google OAuth only, so the entire
// interaction is one button. The page's job is to:
// 1. Communicate what CampusKart is (one line)
// 2. Communicate who can use it (@rvce.edu.in only)
// 3. Give the user exactly one action: Continue with Google
// Anything more is noise.

const Login = () => {
  const { isLoggedIn } = useAuth();
  const navigate       = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const storedError = sessionStorage.getItem('auth-error');
    if (storedError) {
      setError(storedError);
      sessionStorage.removeItem('auth-error');
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin, scopes: 'email profile' },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Failed to start Google login.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-primary)', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
            CampusKart
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            The student marketplace for RVCE
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '28px' }}>

          {/* RVCE notice */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px', background: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Requires an <strong>@rvce.edu.in</strong> Google account
            </span>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '11px 16px',
              background: loading ? 'var(--color-bg-hover)' : 'white',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-sans)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'background 0.15s, border-color 0.15s',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--color-border)'; } }}
          >
            {loading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.6s linear infinite' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2"/>
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          {/* Error */}
          {error && (
            <div style={{ marginTop: '14px', padding: '10px 12px', background: 'var(--color-danger-subtle)', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--color-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '16px', lineHeight: 1, flexShrink: 0, padding: 0 }}>×</button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '20px' }}>
          By signing in you agree to use this platform responsibly.
        </p>
      </div>
    </div>
  );
};

export default Login;