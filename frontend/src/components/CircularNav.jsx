import { useCallback, useEffect, useState } from 'react';
import { Bell, LayoutDashboard, ListPlus, Menu, Shapes, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const NAV_ITEMS = [
  { name: 'Categories', icon: Shapes, action: 'categories', x: -150, y: -104 },
  { name: 'Notifications', icon: Bell, to: '/notifications', x: -83, y: -156 },
  { name: 'Profile', icon: User, to: '/profile', x: 0, y: -175 },
  { name: 'List item', icon: ListPlus, to: '/sell', x: 83, y: -156 },
  { name: 'My items', icon: LayoutDashboard, to: '/dashboard', x: 150, y: -104 },
];

const CircularNav = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleMenu = useCallback(() => setIsOpen(open => !open), []);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') setIsOpen(false);
      if (event.key.toLowerCase() === 'm' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
        toggleMenu();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleMenu]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  useEffect(() => {
    if (!isLoggedIn) {
      return undefined;
    }

    let cancelled = false;
    api.get('/api/notifications')
      .then(response => {
        if (!cancelled) setUnreadCount(response.data.unread_count || 0);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const activateItem = item => {
    setIsOpen(false);
    if (item.action === 'categories') {
      window.dispatchEvent(new CustomEvent('campuskart:open-categories'));
      return;
    }
    navigate(item.to);
  };

  return (
    <>
      <style>{`
        .circular-nav-layer { position: fixed; inset: 0; z-index: 920; pointer-events: none; }
        .circular-nav-backdrop { position: absolute; inset: 0; border: 0; background: rgba(0,0,0,.72); opacity: 0; pointer-events: none; transition: opacity .25s ease; backdrop-filter: blur(3px); }
        .circular-nav-layer.open .circular-nav-backdrop { opacity: 1; pointer-events: auto; }
        .circular-nav-item { --item-x: 0px; --item-y: 0px; position: absolute; bottom: 27px; left: 50%; width: 82px; padding: 0; display: grid; justify-items: center; gap: 8px; border: 0; background: transparent; color: #d8d8d8; opacity: 0; transform: translate(-50%, 0) scale(.55); pointer-events: none; cursor: pointer; transition: transform .38s cubic-bezier(.2,.82,.2,1), opacity .2s ease, color .15s ease; }
        .circular-nav-layer.open .circular-nav-item { opacity: 1; transform: translate(calc(-50% + var(--item-x)), var(--item-y)) scale(1); pointer-events: auto; }
        .circular-nav-item:hover { color: #fff; }
        .circular-nav-item-icon { position: relative; width: 54px; height: 54px; display: grid; place-items: center; border: 1px solid #343434; border-radius: 50%; background: rgba(10,10,10,.92); box-shadow: 0 10px 30px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.05); backdrop-filter: blur(18px); transition: border-color .15s ease, transform .15s ease, background .15s ease; }
        .circular-nav-item:hover .circular-nav-item-icon { border-color: #777; background: #141414; transform: translateY(-2px); }
        .circular-nav-item-label { font-size: 9px; font-weight: 650; letter-spacing: .09em; text-transform: uppercase; white-space: nowrap; }
        .circular-nav-badge { position: absolute; top: -3px; right: -3px; min-width: 18px; height: 18px; padding: 0 4px; display: grid; place-items: center; border: 2px solid #090909; border-radius: 999px; background: #f4f4f4; color: #090909; font-size: 8px; font-weight: 800; }
        .circular-nav-trigger { position: absolute; bottom: 22px; left: 50%; min-width: 108px; height: 46px; padding: 0 17px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; border: 1px solid #303030; border-radius: 999px; background: rgba(10,10,10,.88); color: #a5a5a5; box-shadow: 0 7px 28px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05); backdrop-filter: blur(18px); transform: translateX(-50%); pointer-events: auto; cursor: pointer; transition: color .2s ease, border-color .2s ease, transform .2s ease, background .2s ease; }
        .circular-nav-trigger:hover { color: #fff; border-color: #555; background: rgba(18,18,18,.94); transform: translateX(-50%) translateY(-2px); }
        .circular-nav-trigger span { font-size: 10px; font-weight: 650; letter-spacing: .2em; text-transform: uppercase; }
        .circular-nav-trigger svg { transition: transform .28s ease; }
        .circular-nav-layer.open .circular-nav-trigger { color: #f4f4f4; border-color: #555; }
        .circular-nav-trigger:focus-visible, .circular-nav-item:focus-visible .circular-nav-item-icon { outline: 1px solid #f4f4f4; outline-offset: 3px; }
        @media (max-width: 520px) {
          .circular-nav-item { width: 72px; }
          .circular-nav-item:nth-of-type(2) { --item-x: -122px !important; --item-y: -86px !important; }
          .circular-nav-item:nth-of-type(3) { --item-x: -67px !important; --item-y: -134px !important; }
          .circular-nav-item:nth-of-type(4) { --item-x: 0px !important; --item-y: -151px !important; }
          .circular-nav-item:nth-of-type(5) { --item-x: 67px !important; --item-y: -134px !important; }
          .circular-nav-item:nth-of-type(6) { --item-x: 122px !important; --item-y: -86px !important; }
          .circular-nav-item-icon { width: 50px; height: 50px; }
          .circular-nav-item-label { font-size: 8px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .circular-nav-backdrop, .circular-nav-item, .circular-nav-trigger, .circular-nav-trigger svg { transition: none; }
        }
      `}</style>

      <div className={`circular-nav-layer${isOpen ? ' open' : ''}`}>
        <button className="circular-nav-backdrop" type="button" onClick={() => setIsOpen(false)} aria-label="Close quick navigation" />

        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const badge = isLoggedIn && item.to === '/notifications' ? unreadCount : 0;
          return (
            <button
              key={item.name}
              type="button"
              className="circular-nav-item"
              style={{ '--item-x': `${item.x}px`, '--item-y': `${item.y}px`, transitionDelay: `${index * 35}ms` }}
              onClick={() => activateItem(item)}
              aria-label={item.name}
              tabIndex={isOpen ? 0 : -1}
            >
              <span className="circular-nav-item-icon">
                <Icon size={20} strokeWidth={1.45} />
                {badge > 0 && <span className="circular-nav-badge">{badge > 9 ? '9+' : badge}</span>}
              </span>
              <span className="circular-nav-item-label">{item.name}</span>
            </button>
          );
        })}

        <button className="circular-nav-trigger" type="button" onClick={toggleMenu} aria-expanded={isOpen} aria-label={isOpen ? 'Close quick navigation' : 'Open quick navigation'}>
          {isOpen ? <X size={17} strokeWidth={1.4} /> : <Menu size={17} strokeWidth={1.4} />}
          <span>{isOpen ? 'Close' : 'Navigate'}</span>
        </button>
      </div>
    </>
  );
};

export default CircularNav;
