// ============================================================
// components/Button.jsx — Shared button component
// ============================================================
// WHY this exists:
// Every page (Sell, Profile, Setup, Dashboard, Admin) was re-writing
// the same button styles inline. This component centralizes that —
// change the look once here, every button in the app updates.
//
// It uses the .btn-primary / .btn-secondary / .btn-danger / .btn-ghost
// classes already defined in index.css, plus a loading state that's
// reused everywhere instead of each page inventing its own spinner logic.
// ============================================================

const Button = ({
  children,
  variant = 'primary',   // 'primary' | 'secondary' | 'danger' | 'ghost'
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  style,
  ...rest                // any other prop (e.g. aria-label) passes through
}) => {
  const classMap = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    ghost:     'btn-ghost',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classMap[variant] || 'btn-primary'}
      style={{ width: fullWidth ? '100%' : undefined, ...style }}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};

// ── Spinner ──────────────────────────────────────────────────
// A small rotating ring shown inside buttons during async actions.
// CSS animation (not JS) — runs on the GPU, doesn't block the main thread.
const Spinner = () => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    style={{ animation: 'spin 0.6s linear infinite' }}
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default Button;