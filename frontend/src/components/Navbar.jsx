// ============================================================
// components/Navbar.jsx
// ============================================================
// The top navigation bar shown on every page.
// Shows different options based on auth state:
//   Logged out: Browse, Login
//   Logged in:  Browse, Sell, My Listings, notification bell, Logout
//   Admin:      + Admin panel link
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Navbar = () => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch unread notification count on mount and every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/api/notifications');
        setUnreadCount(res.data.unread_count || 0);
      } catch {
        // Silently fail — notifications are not critical
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval); // cleanup on unmount
  }, [isLoggedIn]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 1.5rem',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1d4ed8' }}>
          🛒 CampusKart
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/" style={linkStyle}>Browse</Link>

        {isLoggedIn && (
          <>
            <Link to="/sell" style={linkStyle}>+ Sell</Link>
            <Link to="/dashboard" style={linkStyle}>My Listings</Link>
            {isAdmin && (
              <Link to="/admin" style={{ ...linkStyle, color: '#dc2626' }}>
                Admin
              </Link>
            )}
            {/* Notification bell */}
            <Link to="/notifications" style={{ position: 'relative', textDecoration: 'none' }}>
              <span style={{ fontSize: '1.2rem' }}>🔔</span>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  background: '#dc2626',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Hi, {user?.name?.split(' ')[0]}
            </span>
            <button onClick={handleLogout} style={btnStyle}>
              Logout
            </button>
          </>
        )}

        {!isLoggedIn && (
          <Link to="/login">
            <button style={{ ...btnStyle, background: '#1d4ed8', color: 'white' }}>
              Login
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
};

const linkStyle = {
  textDecoration: 'none',
  color: '#374151',
  fontSize: '14px',
  fontWeight: 500,
};

const btnStyle = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  background: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
};

export default Navbar;