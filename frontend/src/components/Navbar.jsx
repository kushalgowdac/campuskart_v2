import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { openGuide } from './GuideModal';
import api from '../api';

const MENU_LINKS = [
  ['Shop all', '/browse'],
  ['Books', '/browse?category=Books'],
  ['Electronics', '/browse?category=Electronics'],
  ['Clothing', '/browse?category=Clothing'],
  ['Stationery', '/browse?category=Stationery'],
  ['Sports', '/browse?category=Sports'],
  ['Other', '/browse?category=Other'],
];

const Navbar = () => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const lastScrollY = useRef(0);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (y <= 12) setNavHidden(false);
      else if (delta > 3) setNavHidden(true);
      else if (delta < -3) setNavHidden(false);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const urlQuery = new URLSearchParams(location.search).get('q') || '';
    Promise.resolve().then(() => {
      setQuery(urlQuery);
      setMenuOpen(false);
      setSearchOpen(false);
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/api/notifications');
        setUnreadCount(res.data.unread_count || 0);
      } catch {
        // Navigation remains usable if notification fetching fails.
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = event => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const openCategories = () => {
      setSearchOpen(false);
      setMenuOpen(true);
    };
    window.addEventListener('campuskart:open-categories', openCategories);
    return () => window.removeEventListener('campuskart:open-categories', openCategories);
  }, []);

  const openMenu = ({ focusSearch = false } = {}) => {
    setMenuOpen(true);
    setSearchOpen(focusSearch);
  };

  const submitSearch = event => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/browse?q=${encodeURIComponent(value)}` : '/browse');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/browse');
  };

  const isActive = target => {
    if (!target.startsWith('/browse')) return location.pathname === target;
    if (location.pathname !== '/browse') return false;
    const targetCategory = new URLSearchParams(target.split('?')[1] || '').get('category');
    const currentCategory = new URLSearchParams(location.search).get('category');
    return targetCategory ? targetCategory === currentCategory : !currentCategory;
  };

  return (
    <>
      <style>{`
        .minimal-nav-spacer { height: 72px; }
        .minimal-nav { position: fixed; inset: 0; z-index: 1000; pointer-events: none; font-family: var(--font-sans); }
        .minimal-nav-bar, .minimal-nav-panel { width: min(576px, calc(100vw - 32px)); background: #080808; color: #f5f5f5; border: 1px solid #262626; border-radius: 9px; }
        .minimal-nav-bar { position: absolute; top: 8px; left: 50%; height: 48px; transform: translateX(-50%); display: grid; grid-template-columns: auto 1fr auto; align-items: center; pointer-events: auto; box-shadow: 0 10px 35px rgba(0,0,0,.35); transition: transform .3s cubic-bezier(.22,1,.36,1), opacity .3s ease; }
        .minimal-nav-bar.is-hidden { transform: translate(-50%, -150%); opacity: 0; pointer-events: none; }
        .minimal-nav-left, .minimal-nav-right { display: flex; align-items: center; }
        .minimal-nav-left { justify-self: start; }
        .minimal-nav-right { justify-self: end; }
        .minimal-nav-brand { justify-self: center; color: inherit; text-decoration: none; font-size: 16px; font-weight: 610; letter-spacing: .13em; text-transform: uppercase; transition: font-size .3s ease, opacity .3s ease, letter-spacing .3s ease; }
        .minimal-nav-bar.is-hidden .minimal-nav-brand { font-size: 11px; opacity: 0; letter-spacing: .2em; }
        .minimal-nav-icon { width: 48px; height: 48px; display: grid; place-items: center; border: 0; background: transparent; color: #858585; cursor: pointer; }
        .minimal-nav-icon:hover { color: #f5f5f5; }
        .minimal-nav-icon:focus-visible, .minimal-menu-link:focus-visible, .minimal-menu-footer a:focus-visible, .minimal-menu-footer button:focus-visible { outline: 1px solid #f5f5f5; outline-offset: -4px; }
        .minimal-search-button { position: relative; }
        .minimal-notification-dot { position: absolute; top: 11px; right: 10px; min-width: 13px; height: 13px; padding: 0 3px; display: grid; place-items: center; border-radius: 20px; background: #f5f5f5; color: #090909; font-size: 7px; font-weight: 700; }
        .minimal-nav-backdrop { position: absolute; inset: 0; border: 0; background: rgba(0,0,0,.93); pointer-events: auto; cursor: default; animation: minimalFade .18s ease-out; }
        .minimal-nav-panel { position: absolute; top: 8px; bottom: 8px; left: 50%; transform: translateX(-50%); display: grid; grid-template-rows: 48px auto 1fr auto; overflow: hidden; pointer-events: auto; animation: minimalPanelIn .22s ease-out; }
        .minimal-menu-head { display: grid; grid-template-columns: 48px 1fr 48px; align-items: center; }
        .minimal-menu-search { width: min(400px, calc(100% - 64px)); margin: 22px auto 0; align-self: start; }
        .minimal-menu-search form { position: relative; }
        .minimal-menu-search svg { position: absolute; left: 0; top: 50%; transform: translateY(-50%); color: #707070; }
        .minimal-menu-search input { width: 100%; height: 38px; padding: 0 30px; border: 0; border-bottom: 1px solid #333; border-radius: 0; outline: 0; background: transparent; color: #f5f5f5; font: inherit; font-size: 12px; letter-spacing: .06em; text-transform: uppercase; }
        .minimal-menu-search input::placeholder { color: #686868; }
        .minimal-menu-search input:focus { border-bottom-color: #aaa; }
        .minimal-menu-nav { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: clamp(10px, 2vh, 20px); padding: 20px 24px; }
        .minimal-menu-link { color: #f5f5f5; text-decoration: none; text-align: center; text-transform: uppercase; font-family: 'Courier New', monospace; font-size: clamp(27px, 4.2vh, 39px); font-weight: 700; line-height: .98; letter-spacing: -.075em; transition: color .15s ease; }
        .minimal-menu-link:hover, .minimal-menu-link.active { color: #6e6e6e; }
        .minimal-menu-footer { min-height: 62px; padding: 0 28px 26px; display: flex; align-items: end; justify-content: center; flex-wrap: wrap; gap: 10px 22px; }
        .minimal-menu-footer a, .minimal-menu-footer button { padding: 0; border: 0; background: none; color: #8a8a8a; text-decoration: none; font: inherit; font-size: 10px; line-height: 1; text-transform: uppercase; cursor: pointer; }
        .minimal-menu-footer a:hover, .minimal-menu-footer button:hover { text-decoration: underline; }
        @keyframes minimalFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes minimalPanelIn { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @media (max-height: 720px) {
          .minimal-menu-nav { gap: 8px; }
          .minimal-menu-link { font-size: clamp(23px, 4.5vh, 31px); }
          .minimal-menu-search { margin-top: 8px; }
        }
        @media (max-width: 520px) {
          .minimal-nav-bar, .minimal-nav-panel { width: calc(100vw - 16px); }
          .minimal-menu-search { width: calc(100% - 48px); }
          .minimal-menu-footer { gap: 12px 17px; padding-inline: 18px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .minimal-nav-backdrop, .minimal-nav-panel { animation: none; }
          .minimal-nav-bar, .minimal-nav-brand { transition: none; }
        }
      `}</style>

      <div className="minimal-nav-spacer" aria-hidden="true" />
      <header className="minimal-nav">
        {!menuOpen && (
          <div className={`minimal-nav-bar${navHidden ? ' is-hidden' : ''}`}>
            <div className="minimal-nav-left">
              <button className="minimal-nav-icon" type="button" onClick={goBack} aria-label="Go back">
                <ArrowLeft size={18} strokeWidth={1.4} />
              </button>
              <button className="minimal-nav-icon" type="button" onClick={() => openMenu()} aria-label="Open navigation menu">
                <Menu size={17} strokeWidth={1.4} />
              </button>
            </div>
            <Link to="/browse" className="minimal-nav-brand">CampusKart</Link>
            <div className="minimal-nav-right">
              <ThemeToggle />
              <button className="minimal-nav-icon minimal-search-button" type="button" onClick={() => openMenu({ focusSearch: true })} aria-label="Search products">
                <Search size={19} strokeWidth={1.4} />
                {unreadCount > 0 && <span className="minimal-notification-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
            </div>
          </div>
        )}

        {menuOpen && (
          <>
            <button className="minimal-nav-backdrop" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" />
            <div className="minimal-nav-panel" role="dialog" aria-modal="true" aria-label="Site navigation">
              <div className="minimal-menu-head">
                <button className="minimal-nav-icon" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu">
                  <X size={16} strokeWidth={1.2} />
                </button>
                <Link to="/browse" className="minimal-nav-brand">CampusKart</Link>
                <span />
              </div>

              <div className="minimal-menu-search">
                <form role="search" onSubmit={submitSearch}>
                  <Search size={16} strokeWidth={1.4} />
                  <input ref={searchInputRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products" aria-label="Search products" />
                </form>
              </div>

              <nav className="minimal-menu-nav" aria-label="Product categories">
                {MENU_LINKS.map(([label, target]) => (
                  <Link key={label} to={target} className={`minimal-menu-link${isActive(target) ? ' active' : ''}`}>{label}</Link>
                ))}
              </nav>

              <div className="minimal-menu-footer">
                <Link to={isLoggedIn ? '/profile' : '/login'}>{isLoggedIn ? user?.name?.split(' ')[0] || 'Account' : 'Account'}</Link>
                <Link to="/sell">Sell</Link>
                <button type="button" onClick={() => openGuide()}>Guide</button>
                {isLoggedIn && <Link to="/dashboard">My listings</Link>}
                {isLoggedIn && <Link to="/notifications">Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}</Link>}
                {isAdmin && <Link to="/admin">Admin</Link>}
                {isLoggedIn ? <button type="button" onClick={handleLogout}>Sign out</button> : <Link to="/login">Sign in</Link>}
              </div>
            </div>
          </>
        )}
      </header>
    </>
  );
};

export default Navbar;
