// ============================================================
// components/ErrorBoundary.jsx — Catches React rendering errors
// ============================================================
// WHY this exists:
// If ANY component throws an error during render (e.g. trying to
// read product.seller.name when seller is null), React unmounts
// the entire app and the user sees a BLANK WHITE SCREEN with zero
// explanation. This is the single worst failure mode for a user.
//
// ErrorBoundary is a special React class component (must be a class —
// hooks don't support this lifecycle yet) that catches errors thrown
// by any of its children during rendering, and shows a fallback UI
// instead of crashing the whole page.
//
// IMPORTANT: ErrorBoundary does NOT catch errors in:
//   - event handlers (onClick, onChange) — use try/catch there
//   - async code (promises, setTimeout) — use .catch() there
//   - server-side rendering
// It ONLY catches errors thrown during the render phase itself.
// ============================================================

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // getDerivedStateFromError is called when a child throws during render.
  // React calls this BEFORE the next render — we use it to flip hasError to true.
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // componentDidCatch is called AFTER the error, with more details.
  // Good place to log to an error tracking service (Sentry, LogRocket, etc.)
  // For now we just log to console so you can debug during development.
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/'; // safest recovery: go home and reload
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px', maxWidth: '360px' }}>
            This page hit an unexpected error. Try going back to the homepage.
          </p>
          <button onClick={this.handleReset} className="btn-primary">
            Go to homepage
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
