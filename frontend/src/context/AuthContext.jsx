import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import api from '../api';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export { supabase };

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserProfile = async (session) => {
    try {
      localStorage.setItem('token', session.access_token);

      const res = await api.post('/api/auth/sync-user');
      const appUser = res.data.user;

      localStorage.setItem('user', JSON.stringify(appUser));
      sessionStorage.removeItem('auth-error'); // clear any old error
      setUser(appUser);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed.';
      console.error('[AuthContext] sync failed:', errMsg);

      // Store error in sessionStorage — survives the page that comes after redirect
      // Custom events get lost on remount, sessionStorage persists until tab closes
      sessionStorage.setItem('auth-error', errMsg);

      await supabase.auth.signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);

      // Redirect to login so the error is displayed
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncUserProfile(session).finally(() => setLoading(false));
      } else {
        try {
          const stored = localStorage.getItem('user');
          if (stored) setUser(JSON.parse(stored));
        } catch {}
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await syncUserProfile(session);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          localStorage.setItem('token', session.access_token);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const login = (_, userData) => setUser(userData);

  const isLoggedIn = !!user;
  const isAdmin    = user?.role === 'admin';

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#6b7280', fontSize: '14px',
    }}>
      Loading...
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, isAdmin, supabase }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};