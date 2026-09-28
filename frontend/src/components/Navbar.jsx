import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Dumbbell, Grid3X3, Laptop, Menu, PackagePlus, Pencil, Search, Shirt, ShoppingBag, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CATEGORIES = [
  ['All', Grid3X3],
  ['Books', BookOpen],
  ['Electronics', Laptop],
  ['Clothing', Shirt],
  ['Stationery', Pencil],
  ['Sports', Dumbbell],
];

const Navbar = () => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const urlQuery = new URLSearchParams(location.search).get('q') || '';
    Promise.resolve().then(() => {
      setQuery(urlQuery);
      setMobileOpen(false);
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/api/notifications');
        setUnreadCount(res.data.unread_count || 0);
      } catch {
        // Navigation remains usable if the notification request fails.
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/browse?q=${encodeURIComponent(value)}` : '/browse');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="store-header">
      <style>{`
        .store-header { position: sticky; top: 0; z-index: 100; background: rgba(3,9,20,.98); border-bottom: 1px solid var(--color-border); backdrop-filter: blur(14px); }
        .store-header-main { max-width: 1180px; height: 66px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 18px; }
        .store-brand { display: inline-flex; align-items: center; gap: 9px; flex-shrink: 0; color: var(--color-text-primary); text-decoration: none; font-size: 17px; font-weight: 750; letter-spacing: -.035em; }
        .store-brand-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 8px; background: var(--color-accent); color: #04101c; }
        .store-search { position: relative; flex: 1; max-width: 620px; }
        .store-search > svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); }
        .store-search input { width: 100%; height: 40px; padding: 0 82px 0 40px; border: 1px solid var(--color-border-strong); border-radius: 8px; outline: none; background: var(--color-bg-subtle); color: var(--color-text-primary); font: inherit; font-size: 13px; }
        .store-search input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(120,198,255,.1); }
        .store-search input::placeholder { color: var(--color-text-muted); }
        .store-search button { position: absolute; top: 4px; right: 4px; height: 32px; padding: 0 13px; border: 0; border-radius: 6px; background: var(--color-accent); color: #04101c; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
        .store-actions { display: flex; align-items: center; gap: 5px; margin-left: auto; }
        .store-action { min-height: 36px; padding: 0 10px; display: inline-flex; align-items: center; gap: 7px; border: 0; border-radius: 7px; background: transparent; color: var(--color-text-secondary); text-decoration: none; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
        .store-action:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
        .store-action-primary { border: 1px solid var(--color-border); color: var(--color-text-primary); }
        .store-account { display: grid; line-height: 1.05; }
        .store-account small { color: var(--color-text-muted); font-size: 9px; font-weight: 500; }
        .store-notification { position: relative; }
        .store-count { position: absolute; top: 0; right: 0; min-width: 15px; height: 15px; padding: 0 3px; display: grid; place-items: center; border-radius: 999px; background: var(--color-danger); color: #24080c; font-size: 8px; font-weight: 800; }
        .store-categories { border-top: 1px solid rgba(28,56,82,.65); background: var(--color-bg-subtle); }
        .store-categories-inner { max-width: 1180px; height: 44px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 4px; overflow-x: auto; scrollbar-width: none; }
        .store-categories-inner::-webkit-scrollbar { display: none; }
        .store-category { min-width: 92px; padding: 7px 10px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; flex-shrink: 0; border-radius: 7px; color: var(--color-text-secondary); text-decoration: none; font-size: 11px; font-weight: 600; }
        .store-category:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
        .store-category.active { color: var(--color-accent); background: var(--color-accent-subtle); }
        .store-category-spacer { flex: 1; }
        .store-mobile-toggle, .store-mobile-menu { display: none; }
        @media (max-width: 760px) {
          .store-header-main { height: auto; min-height: 60px; padding: 9px 14px; flex-wrap: wrap; gap: 9px; }
          .store-brand { order: 1; }
          .store-actions { order: 2; }
          .store-actions > :not(.store-mobile-toggle) { display: none; }
          .store-mobile-toggle { display: inline-flex; padding: 7px; border: 0; border-radius: 7px; background: transparent; color: var(--color-text-primary); }
          .store-search { order: 3; flex-basis: 100%; max-width: none; }
          .store-categories-inner { padding: 0 14px; }
          .store-mobile-menu { display: grid; padding: 6px 14px 12px; border-top: 1px solid var(--color-border); }
          .store-mobile-menu a, .store-mobile-menu button { padding: 10px 6px; border: 0; border-bottom: 1px solid var(--color-border); background: transparent; color: var(--color-text-primary); text-align: left; text-decoration: none; font: inherit; font-size: 13px; }
        }
      `}</style>

      <div className="store-header-main">
        <Link to="/" className="store-brand"><span className="store-brand-icon"><ShoppingBag size={17} /></span>CampusKart</Link>
        <form className="store-search" role="search" onSubmit={submitSearch}>
          <Search size={16} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products and categories" aria-label="Search products" />
          <button type="submit">Search</button>
        </form>
        <div className="store-actions">
          <Link to="/sell" className="store-action store-action-primary"><PackagePlus size={16} /> Sell</Link>
          {isLoggedIn && <Link to="/notifications" className="store-action store-notification" aria-label="Notifications"><Bell size={17} />{unreadCount > 0 && <span className="store-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}</Link>}
          <Link to={isLoggedIn ? '/profile' : '/login'} className="store-action"><UserRound size={17} /><span className="store-account"><small>{isLoggedIn ? `Hello, ${user?.name?.split(' ')[0] || 'RVIAN'}` : 'Welcome'}</small>{isLoggedIn ? 'Account' : 'Login'}</span></Link>
          <button type="button" className="store-mobile-toggle" onClick={() => setMobileOpen(open => !open)} aria-label="Toggle navigation">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>

      <nav className="store-categories" aria-label="Product categories">
        <div className="store-categories-inner">
          {CATEGORIES.map(([category, Icon]) => {
            const target = category === 'All' ? '/browse' : `/browse?category=${encodeURIComponent(category)}`;
            const active = location.pathname === '/browse' && (category === 'All' ? !new URLSearchParams(location.search).get('category') : new URLSearchParams(location.search).get('category') === category);
            return <Link key={category} to={target} className={`store-category${active ? ' active' : ''}`}><Icon size={15} />{category}</Link>;
          })}
          <span className="store-category-spacer" />
          <Link to="/guide" className="store-category">How it works</Link>
          {isLoggedIn && <Link to="/dashboard" className="store-category">My listings</Link>}
          {isAdmin && <Link to="/admin" className="store-category">Admin</Link>}
        </div>
      </nav>

      {mobileOpen && <nav className="store-mobile-menu"><Link to="/browse">Browse products</Link><Link to="/sell">Sell an item</Link><Link to="/guide">How it works</Link>{isLoggedIn && <Link to="/dashboard">My listings</Link>}{isLoggedIn ? <button type="button" onClick={handleLogout}>Sign out</button> : <Link to="/login">Sign in / Sign up</Link>}</nav>}
    </header>
  );
};

export default Navbar;
