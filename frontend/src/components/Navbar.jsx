import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Navbar = () => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/api/notifications');
        setUnreadCount(res.data.unread_count || 0);
      } catch {
        // Silently fail
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: 'var(--background)',
      borderBottom: '2px solid var(--border)',
      padding: '0 1.5rem',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--foreground)', letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
          CAMPUSKART //
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/" className="brutalist-btn" style={{ padding: '0.4rem 1rem', height: '38px', minHeight: '38px', fontSize: '0.8rem' }}>
          BROWSE
        </Link>

        {isLoggedIn ? (
          <>
            <Link to="/sell" className="brutalist-btn brutalist-btn-primary" style={{ padding: '0.4rem 1rem', height: '38px', minHeight: '38px', fontSize: '0.8rem' }}>
              + SELL
            </Link>
            <Link to="/dashboard" className="brutalist-btn" style={{ padding: '0.4rem 1rem', height: '38px', minHeight: '38px', fontSize: '0.8rem' }}>
              MY LISTINGS
            </Link>
            {isAdmin && (
              <Link to="/admin" className="brutalist-btn brutalist-btn-danger" style={{ padding: '0.4rem 1rem', height: '38px', minHeight: '38px', fontSize: '0.8rem' }}>
                ADMIN
              </Link>
            )}
            
            {/* Notification bell */}
            <Link to="/notifications" style={{ position: 'relative', textDecoration: 'none', display: 'flex', alignItems: 'center', margin: '0 0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🔔</span>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-10px',
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                  border: '1px solid var(--border)',
                  width: '16px',
                  height: '16px',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link to="/profile" className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', textDecoration: 'none' }}>
              Hi, {user?.name?.split(' ')[0]}
            </Link>
            <button onClick={handleLogout} className="brutalist-btn" style={{ padding: '0.4rem 1rem', height: '38px', minHeight: '38px', fontSize: '0.8rem' }}>
              LOGOUT
            </button>
          </>
        ) : (
          <Link to="/login">
            <button className="brutalist-btn brutalist-btn-primary" style={{ padding: '0.4rem 1.2rem', height: '38px', minHeight: '38px', fontSize: '0.8rem' }}>
              LOGIN
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;