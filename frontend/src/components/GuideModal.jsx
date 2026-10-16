/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BUYER_STEPS, SELLER_STEPS } from '../content/marketplaceGuide';

export const openGuide = () => window.dispatchEvent(new CustomEvent('campuskart:open-guide'));

const GUEST_GUIDE_SEEN_KEY = 'campuskart:guide-seen:guest';
const AUTH_GUIDE_SEEN_PREFIX = 'campuskart:guide-seen:user:';

const readGuideMarker = key => {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

const writeGuideMarker = key => {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // Showing the guide is still useful when storage is unavailable.
  }
};

const StepColumn = ({ label, title, steps }) => (
  <div className="guide-modal-col">
    <div className="guide-modal-col-head">
      <span aria-hidden="true">{label}</span>
      <h3>{title}</h3>
    </div>
    <ol>
      {steps.map((step, index) => (
        <li key={step}>
          <span aria-hidden="true">{index + 1}</span>
          <p>{step}</p>
        </li>
      ))}
    </ol>
  </div>
);

const GuideModal = () => {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('campuskart:open-guide', openHandler);
    return () => window.removeEventListener('campuskart:open-guide', openHandler);
  }, []);

  // Give first-time visitors the guide when they enter the product gallery.
  // Guest and authenticated visits have separate markers so logging in after
  // browsing still gets the authenticated first-run guide exactly once.
  useEffect(() => {
    if (location.pathname !== '/browse') return;

    const identity = user?.id || user?.email || 'current';
    const marker = isLoggedIn
      ? `${AUTH_GUIDE_SEEN_PREFIX}${identity}`
      : GUEST_GUIDE_SEEN_KEY;

    if (readGuideMarker(marker)) return;
    writeGuideMarker(marker);
    const timerId = window.setTimeout(() => setOpen(true), 0);
    return () => window.clearTimeout(timerId);
  }, [isLoggedIn, location.pathname, user?.email, user?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = event => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <style>{`
        .guide-modal-layer { position: fixed; inset: 0; z-index: 1300; display: grid; place-items: center; padding: 20px; }
        .guide-modal-backdrop { position: absolute; inset: 0; border: 0; background: rgba(0,0,0,.72); backdrop-filter: blur(3px); cursor: default; animation: guideFade .18s ease-out; }
        .guide-modal-card { position: relative; width: min(760px, 100%); max-height: min(86vh, 720px); overflow-y: auto; padding: 34px 34px 30px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-lg); background: var(--color-bg-subtle); color: var(--color-text-primary); box-shadow: var(--shadow-lg); animation: guideIn .22s ease-out; }
        .guide-modal-close { position: absolute; top: 14px; right: 14px; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 999px; background: transparent; color: var(--color-text-secondary); cursor: pointer; transition: color .15s ease, border-color .15s ease, background .15s ease; }
        .guide-modal-close:hover { color: var(--color-text-primary); border-color: var(--color-border-strong); background: var(--color-bg-hover); }
        .guide-modal-eyebrow { display: inline-block; margin-bottom: 10px; color: var(--color-text-secondary); font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
        .guide-modal-head { max-width: 560px; margin-bottom: 26px; padding-right: 40px; }
        .guide-modal-head h2 { margin: 0 0 10px; font-size: clamp(24px, 3vw, 32px); letter-spacing: -.04em; line-height: 1.1; }
        .guide-modal-head p { margin: 0; color: var(--color-text-secondary); font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.35; }
        .guide-modal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .guide-modal-col { padding: 22px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-primary); }
        .guide-modal-col-head { display: flex; align-items: center; gap: 11px; margin-bottom: 20px; }
        .guide-modal-col-head h3 { margin: 0; font-size: 17px; letter-spacing: -.02em; }
        .guide-modal-col-head > span { width: 28px; height: 28px; display: grid; place-items: center; flex: 0 0 28px; border-radius: 50%; background: var(--color-accent); color: var(--color-bg-primary); font-size: 12px; font-weight: 700; }
        .guide-modal-col ol { display: grid; gap: 16px; margin: 0; padding: 0; list-style: none; }
        .guide-modal-col li { display: grid; grid-template-columns: 24px 1fr; gap: 11px; align-items: start; }
        .guide-modal-col li > span { width: 24px; height: 24px; display: grid; place-items: center; border: 1px solid var(--color-border-strong); border-radius: 50%; color: var(--color-text-secondary); font-size: 11px; font-weight: 700; }
        .guide-modal-col li p { margin: 1px 0 0; color: var(--color-text-secondary); font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-weight: 400; line-height: 1.35; }
        .guide-modal-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 26px; }
        .guide-modal-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 24px; border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; transition: transform .15s ease, background .15s ease, border-color .15s ease; }
        .guide-modal-btn:hover { transform: translateY(-1px); }
        .guide-modal-btn-primary { background: var(--color-accent); color: var(--color-bg-primary); }
        .guide-modal-btn-secondary { border-color: var(--color-border-strong); background: transparent; color: var(--color-text-primary); }
        .guide-modal-btn-secondary:hover { background: var(--color-bg-hover); }
        @keyframes guideFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes guideIn { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
        @media (max-width: 640px) {
          .guide-modal-layer { padding: 12px; }
          .guide-modal-card { padding: 26px 20px 22px; }
          .guide-modal-grid { grid-template-columns: 1fr; }
          .guide-modal-actions { flex-direction: column; }
          .guide-modal-btn { width: 100%; }
        }
        .light .guide-modal-card { color: #111111; }
        .light .guide-modal-head h2, .light .guide-modal-col-head h3 { color: #111111; }
        .light .guide-modal-head p, .light .guide-modal-col li p { color: #4a4a4a; }
        .light .guide-modal-col { background: #f5f5f5; }
        .light .guide-modal-col li > span { color: #4a4a4a; border-color: #b8b8b8; }
        @media (prefers-reduced-motion: reduce) {
          .guide-modal-backdrop, .guide-modal-card { animation: none; }
        }
      `}</style>

      <div className="guide-modal-layer" role="dialog" aria-modal="true" aria-label="CampusKart guide">
        <button className="guide-modal-backdrop" type="button" onClick={() => setOpen(false)} aria-label="Close guide" />
        <div className="guide-modal-card" role="document">
          <button className="guide-modal-close" type="button" onClick={() => setOpen(false)} aria-label="Close guide">
            <X size={18} strokeWidth={1.5} />
          </button>

          <div className="guide-modal-head">
            <span className="guide-modal-eyebrow">CampusKart guide</span>
            <h2>How CampusKart works</h2>
            <p>Buy and sell within RVCE — browse listings, connect directly, and meet safely on campus.</p>
          </div>

          <div className="guide-modal-grid">
            <StepColumn label="B" title="For buyers" steps={BUYER_STEPS} />
            <StepColumn label="S" title="For sellers" steps={SELLER_STEPS} />
          </div>

          <div className="guide-modal-actions">
            <Link to="/browse" className="guide-modal-btn guide-modal-btn-primary" onClick={() => setOpen(false)}>
              Browse products
            </Link>
            <Link
              to={isLoggedIn ? '/sell' : '/login'}
              className="guide-modal-btn guide-modal-btn-secondary"
              onClick={() => setOpen(false)}
            >
              {isLoggedIn ? 'List an item' : 'Sign in'}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuideModal;
