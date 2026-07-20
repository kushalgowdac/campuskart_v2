// ============================================================
// pages/Contribute.jsx — Community page
// ============================================================
// Purpose: Let students who use CampusKart:
//   1. Join the WhatsApp channel for updates and announcements
//   2. Submit feedback or feature suggestions
//   3. Express interest in contributing to future projects
//
// Kept intentionally lightweight — no backend needed.
// Feedback goes via mailto (email) so there's no DB, no form API,
// no spam risk, and it works even on free hosting.
// WhatsApp channel link opens in WhatsApp directly.
// ============================================================

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// ── Replace these with your actual links ─────────────────────
const WHATSAPP_CHANNEL = 'https://whatsapp.com/channel/YOUR_CHANNEL_LINK';
const FEEDBACK_EMAIL   = 'kushalgowdac.cs23@rvce.edu.in';
// ─────────────────────────────────────────────────────────────

const Contribute = () => {
  const { user } = useAuth();
  const [feedback, setFeedback]   = useState('');
  const [name, setName]           = useState(user?.name || '');
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = () => {
    if (!feedback.trim()) return;
    const subject = encodeURIComponent('CampusKart Feedback');
    const body    = encodeURIComponent(
      `Name: ${name || 'Anonymous'}\nEmail: ${user?.email || 'Not logged in'}\n\nFeedback:\n${feedback}`
    );
    window.open(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`);
    setSubmitted(true);
    setFeedback('');
  };

  return (
    <div className="page-narrow">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Contribute to CampusKart
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.6 }}>
          CampusKart is built by RVCE students, for RVCE students.
          Join us, share feedback, or help build what comes next.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* WhatsApp channel */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#16a34a">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Join our WhatsApp Channel</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                Get updates when new features ship, be the first to know about bugs we fix,
                and stay connected with the CampusKart community.
              </p>
              <a
                href={WHATSAPP_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: 'inline-flex', textDecoration: 'none', fontSize: '14px' }}
              >
                Join Channel
              </a>
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--color-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Send Feedback</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Found a bug? Have a feature idea? Want something changed?
                We read every message.
              </p>
            </div>
          </div>

          {!submitted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!user && (
                <input
                  className="input"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              )}
              <textarea
                className="input"
                placeholder="What's on your mind? Bug reports, feature requests, general feedback — anything helps."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={4}
                style={{ resize: 'vertical' }}
              />
              <button
                onClick={handleFeedback}
                disabled={!feedback.trim()}
                className="btn-primary"
                style={{ alignSelf: 'flex-start' }}
              >
                Send via Email
              </button>
              <p className="text-muted">Opens your email app with the message pre-filled.</p>
            </div>
          ) : (
            <div style={{ padding: '14px', background: 'var(--color-accent-subtle)', border: '1px solid #6ee7b7', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: '#065f46' }}>
              Thanks! Your email app should have opened. Send the email to submit your feedback.
              <button onClick={() => setSubmitted(false)} style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', textDecoration: 'underline', marginLeft: '8px', fontSize: '14px' }}>
                Send another
              </button>
            </div>
          )}
        </div>

        {/* Contribute / Join team */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--color-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Build with Us</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                We're a small team of CS students building tools for our college.
                If you want to contribute to CampusKart or join future projects,
                reach out.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* What we're looking for */}
            <div style={{ padding: '14px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '6px' }}>What we work on:</strong>
              React frontends · Node.js backends · PostgreSQL · UI design · Testing & QA · Documentation
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('I want to contribute to CampusKart')}&body=${encodeURIComponent(`Hi,\n\nI'm interested in contributing to CampusKart.\n\nName: \nYear/Branch: \nWhat I can help with: `)}`}
                className="btn-primary"
                style={{ textDecoration: 'none', fontSize: '14px' }}
              >
                Get in Touch
              </a>
              <a
                href="https://github.com/kushalgowdac/campuskart_v2"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Built by */}
        <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid var(--color-border)', marginTop: '8px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.8 }}>
            Built at RVCE by Kushal Gowda C and team · 2026<br />
            <a href="https://github.com/kushalgowdac/campuskart_v2" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
              Open source on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contribute;