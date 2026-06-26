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

  // useRef persists a value across renders without triggering re-renders.
  // We use it as a mutex (lock) to prevent syncUserProfile running twice
  // when both getSession() and onAuthStateChange fire at the same time on page load.
  // const syncing = useRef(false); ->> noneed

  const syncUserProfile = async (session) => {
    // if (syncing.current) return null; // already running — skip
    // syncing.current = true;


    try {
      localStorage.setItem('token', session.access_token);
      const res     = await api.post('/api/auth/sync-user');
      //to be removed
      // console.log("Backend response:", res.data);
      // console.log("isNew =", res.data.isNew);
      const appUser = res.data.user;
      const isNew   = res.data.isNew;
      //to be removed
      // console.log("Returning from syncUserProfile:", isNew);
      localStorage.setItem('user', JSON.stringify(appUser));
      sessionStorage.removeItem('auth-error');
      setUser(appUser);
      return isNew;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed.';
      console.error('[AuthContext] sync failed:', errMsg);
      sessionStorage.setItem('auth-error', errMsg);
      await supabase.auth.signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      return null;
    } 
    // finally {
    //   setTimeout(() => { syncing.current = false; }, 500);
    // }
  };

  useEffect(() => {
    // getSession: restore existing session silently on page load/refresh
    // Does NOT redirect — just sets user state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
      try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
      } catch {}
      }
    setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        // INITIAL_SESSION fires on every page load alongside getSession().
        // We skip it here — getSession() already handled it above.
        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_IN' && session) {
          // This fires after a real OAuth redirect back from Google.
          // This is the only place we redirect based on isNew.
          const isNew = await syncUserProfile(session);
      //to be removed
          // console.log("SIGNED_IN got:", isNew);
          if (isNew === null) {
            // sync failed (non-RVCE email, server error, etc.)
            window.location.href = '/login';
          } else if (isNew === true) {
            // First login — go to profile setup
            //to be removed
            // console.log("REDIRECTING TO SETUP");
            window.location.href = '/setup';
          } else {
            // Returning user — go home (but only if currently on /login)
            if (window.location.pathname === '/login') {
              window.location.href = '/';
            }
          }

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px' }}>
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