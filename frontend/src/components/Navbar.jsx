import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// ── Why this file changed ───────────────────────────────────
// The previous version tried to hide desktop links on mobile using
// a '@media (max-width: 640px)' KEY inside a React inline style object.
// That doesn't work — inline styles are plain JS objects, and React just
// sets them as CSS properties directly. There is no such thing as a
// media query INSIDE an inline style object; React silently ignores
// any key it doesn't recognize as a real CSS property.
//
// The fix: real CSS media queries via a <style> tag (or a CSS file).
// We use class names (.desktop-links, .navbar-hamburger) and control
// their visibility with actual @media rules below.

const Navbar = () => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen]   = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setMobileOpen(false));
  }, [location.pathname]);

  // ── Auto-close mobile menu on resize ────────────────────────
  // Without this, if the menu is open and the user maximizes the
  // window (or rotates a tablet), mobileOpen stays true even though
  // the screen is now wide enough for the desktop nav. The dropdown
  // stays visually present until the next route change closes it.
  // This listener closes it the moment the viewport crosses back
  // above the 640px breakpoint, matching the CSS media query above.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 640) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/api/notifications');
        setUnreadCount(res.data.unread_count || 0);
      } catch {
        // A notification badge failure must not affect navigation.
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogout = () => { logout(); navigate('/'); };

  const linkClass = (path) =>
    location.pathname === path ? 'nav-link nav-link-active' : 'nav-link';

  // mobileLinkClass mirrors linkClass but uses the mobile-specific style object
  const mobileLinkClass = (path) =>
    location.pathname === path
      ? { ...styles.mobileLink, ...styles.mobileLinkActive }
      : styles.mobileLink;

  return (
    <>
      {/* Real CSS media query — this is what actually controls
          desktop-links vs hamburger visibility based on screen width. */}
      <style>{`
        .nav-link {
          text-decoration: none;
          color: var(--color-text-secondary);
          font-size: 14px;
          font-weight: 500;
          padding: 6px 10px;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
        }
        .nav-link:hover { background: var(--color-bg-hover); color: var(--color-accent); }
        .nav-link-active {
          color: var(--color-accent);
          font-weight: 600;
          background: var(--color-bg-hover);
        }
        .desktop-links { display: flex; align-items: center; gap: 4px; flex: 1; }
        .navbar-hamburger { display: none; }

        /* Below 640px: hide desktop links, show hamburger button */
        @media (max-width: 640px) {
          .desktop-links { display: none; }
          .navbar-hamburger { display: flex; }
          .navbar-username { display: none; }
        }
      `}</style>

      <nav style={styles.nav}>
        <div style={styles.inner}>
          <Link to="/" style={styles.logo}>CampusKart</Link>

          {/* Desktop nav — hidden below 640px via CSS class */}
          <div className="desktop-links">
            <Link to="/browse" className={linkClass('/browse')}>Browse</Link>
            <Link to="/guide" className={linkClass('/guide')}>Guide</Link>
            {isLoggedIn && (
              <>
                <Link to="/sell"      className={linkClass('/sell')}>Sell</Link>
                <Link to="/dashboard" className={linkClass('/dashboard')}>My Listings</Link>
                <Link to="/profile"   className={linkClass('/profile')}>Profile</Link>
                <Link to="/contribute" className={linkClass('/contribute')}>Contribute</Link>
                {isAdmin && (
                  <Link to="/admin" className="nav-link" style={{ color: '#ef4444' }}>Admin</Link>
                )}
              </>
            )}
          </div>

          <div style={styles.right}>
            {isLoggedIn ? (
              <>
                <Link to="/notifications" style={styles.bell} title="Notifications">
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </Link>
                <span className="navbar-username" style={styles.userName}>
                  {user?.name?.split(' ')[0]}
                </span>
                <button onClick={handleLogout} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '13px' }}>
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login">
                <button className="btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }}>Sign in</button>
              </Link>
            )}

            {/* Hamburger — hidden by default, shown below 640px via CSS class */}
            <button
              className="navbar-hamburger"
              style={styles.hamburger}
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div style={styles.mobileMenu}>
          <Link to="/browse" style={mobileLinkClass('/browse')}>Browse</Link>
          <Link to="/guide" style={mobileLinkClass('/guide')}>Guide</Link>
          {isLoggedIn && (
            <>
              <Link to="/sell"          style={mobileLinkClass('/sell')}>Sell</Link>
              <Link to="/dashboard"     style={mobileLinkClass('/dashboard')}>My Listings</Link>
              <Link to="/notifications" style={mobileLinkClass('/notifications')}>Notifications {unreadCount > 0 && `(${unreadCount})`}</Link>
              <Link to="/profile"       style={mobileLinkClass('/profile')}>Profile</Link>
              <Link to="/contribute" style={mobileLinkClass('/contribute')}>Contribute</Link>
              {isAdmin && <Link to="/admin" style={{ ...mobileLinkClass('/admin'), color: '#ef4444' }}>Admin</Link>}
              <button onClick={handleLogout} style={{ ...styles.mobileLink, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                Sign out
              </button>
            </>
          )}
          {!isLoggedIn && <Link to="/login" style={mobileLinkClass('/login')}>Sign in</Link>}
        </div>
      )}
    </>
  );
};

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(3,9,20,0.92)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--color-border)',
  },
  inner: {
    maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '60px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
  },
  logo: {
    fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)',
    textDecoration: 'none', letterSpacing: '-0.02em', flexShrink: 0,
  },
  right: { display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 },
  bell: {
    position: 'relative', display: 'flex', alignItems: 'center',
    color: 'var(--color-text-secondary)', textDecoration: 'none',
    padding: '6px', borderRadius: '6px', transition: 'background 0.15s, color 0.15s',
  },
  badge: {
    position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: 'white',
    borderRadius: '999px', minWidth: '16px', height: '16px', fontSize: '10px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
  },
  userName: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' },
  hamburger: {
    padding: '6px', border: 'none', background: 'none', cursor: 'pointer',
    color: 'var(--color-text-primary)', borderRadius: '6px', alignItems: 'center', justifyContent: 'center',
  },
  mobileMenu: {
    position: 'fixed', top: '60px', left: 0, right: 0, background: 'var(--color-bg-subtle)',
    borderBottom: '1px solid var(--color-border)', padding: '8px 16px 16px',
    zIndex: 99, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  mobileLink: {
    textDecoration: 'none', color: 'var(--color-text-primary)', fontSize: '15px', fontWeight: 500,
    padding: '12px 8px', borderBottom: '1px solid var(--color-border)', display: 'block',
  },
  mobileLinkActive: {
    color: 'var(--color-text-primary)',
    fontWeight: 700,
    background: 'var(--color-bg-hover)',
    borderRadius: '6px',
  },
};

export default Navbar;
