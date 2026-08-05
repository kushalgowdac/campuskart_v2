import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';

// ── Contact channel definitions ───────────────────────────────
// Each channel needs: a label, a URL builder, and an SVG icon.
// We build the URL dynamically from the seller's stored username.
// Only channels the seller has actually filled in are shown —
// if seller.instagram is null, the Instagram row doesn't appear.
const CHANNELS = [
  {
    key:   'email',
    label: 'Email',
    url:   (v) => `mailto:${v}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    key:   'instagram',
    label: 'Instagram',
    url:   (v) => `https://instagram.com/${v}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    key:   'telegram',
    label: 'Telegram',
    url:   (v) => `https://t.me/${v}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
  },
  {
    key:   'reddit',
    label: 'Reddit',
    url:   (v) => `https://reddit.com/u/${v}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M14.5 9A2.5 2.5 0 0 1 12 11.5"/>
        <circle cx="8.5" cy="13.5" r="1"/><circle cx="15.5" cy="13.5" r="1"/>
        <path d="M9 17c1 1 4 1 6 0"/>
      </svg>
    ),
  },
  {
    key:   'linkedin',
    label: 'LinkedIn',
    url:   (v) => `https://linkedin.com/in/${v}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
];

const ContactSeller = () => {
  const { productId } = useParams();
  const navigate      = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.post(`/api/contact/${productId}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load seller info.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(data.copy_message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = data.copy_message;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="page-narrow">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="skeleton" style={{ height: '24px', width: '50%', borderRadius: '4px' }} />
        <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: '56px', borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton" style={{ height: '56px', borderRadius: 'var(--radius-sm)' }} />
      </div>
    </div>
  );

  if (error) return (
    <div className="page-narrow" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <p style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error}</p>
      <Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>
    </div>
  );

  const { seller, product, copy_message, total_interest } = data;

  // Build the list of channels this seller has provided
  const availableChannels = CHANNELS.filter(ch => seller[ch.key]);

  return (
    <div className="page-narrow">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost"
        style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 8px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      {/* Product context */}
      <div style={{ marginBottom: '6px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
          Contact Seller
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
          {product.title}
          {' · '}
          <span className="text-price" style={{ fontSize: '14px' }}>
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.price)}
          </span>
          {total_interest > 1 && (
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
              · {total_interest} people interested
            </span>
          )}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>

        {/* Copyable message */}
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Copy this intro message
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: '12px', padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', fontStyle: 'italic' }}>
            "{copy_message}"
          </p>
          <Button
            variant={copied ? 'secondary' : 'primary'}
            onClick={copyMessage}
            style={{ fontSize: '13px', padding: '7px 14px' }}
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Copied
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy message
              </>
            )}
          </Button>
        </div>

        {/* Contact channels */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Reach out on
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableChannels.map(ch => (
              <a
                key={ch.key}
                href={ch.url(seller[ch.key])}
                target={ch.key === 'email' ? '_self' : '_blank'}
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'white', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', textDecoration: 'none',
                  color: 'var(--color-text-primary)', transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{ch.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{ch.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{seller[ch.key]}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-muted)' }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </a>
            ))}

            {seller.other_contact_details && (
              <div style={{ padding: '14px 16px', background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                    </svg>
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>Other contact details</span>
                </div>
                <p style={{ margin: 0, paddingLeft: '28px', fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {seller.other_contact_details}
                </p>
              </div>
            )}
          </div>

          {availableChannels.length === 0 && !seller.other_contact_details && (
            <div className="card" style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              The seller hasn't added contact info yet. They've been notified of your interest.
            </div>
          )}
        </div>

        {/* Safety notice */}
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6, padding: '0 8px' }}>
          Communication happens outside CampusKart. Always meet in a safe,
          public place on campus. Never share financial details before verifying the item.
        </p>
      </div>
    </div>
  );
};

export default ContactSeller;
