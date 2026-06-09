import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const ContactSeller = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await api.post(`/api/contact/${productId}`);
        setData(res.data);

        // ── AUTO-COPY on page load ──────────────────────────────
        // The moment we have the intro message, copy it silently.
        // This way the buyer's clipboard is ready before they even
        // choose which channel to reach out on.
        try {
          await navigator.clipboard.writeText(res.data.copy_message);
          setAutoCopied(true);
          // Hide the auto-copy toast after 5 seconds
          setTimeout(() => setAutoCopied(false), 5000);
        } catch {
          // Clipboard access denied — user can still copy manually
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load seller info.');
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, [productId]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(data.copy_message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select text manually
    }
  };

  if (loading) return (
    <div className="label-caps" style={{ textAlign: 'center', padding: '6rem', color: 'var(--muted-foreground)' }}>
      INITIATING DEAL — COPYING INTRO MESSAGE...
    </div>
  );

  if (error) return (
    <div className="brutalist-card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', borderColor: '#ef4444' }}>
      <span className="label-caps" style={{ color: '#ef4444' }}>{error}</span>
    </div>
  );

  const { seller, product, copy_message, total_interest } = data;

  const contacts = [
    { icon: '✉️',  label: 'EMAIL',      value: seller.email,      url: `mailto:${seller.email}`, required: true },
    { icon: '📸', label: 'INSTAGRAM',  value: seller.instagram,  url: `https://instagram.com/${seller.instagram}` },
    { icon: '✈️',  label: 'TELEGRAM',   value: seller.telegram,   url: `https://t.me/${seller.telegram}` },
    { icon: '📧', label: 'GMAIL',      value: seller.gmail,      url: `mailto:${seller.gmail}` },
    { icon: '🔗', label: 'REDDIT',     value: seller.reddit,     url: `https://reddit.com/u/${seller.reddit}` },
  ].filter(c => c.required || c.value);

  return (
    <div style={{ maxWidth: '580px', margin: '2rem auto', padding: '1.5rem' }}>

      {/* ── AUTO-COPY SUCCESS TOAST ─────────────────────────────── */}
      {autoCopied && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#059669',
          color: '#ffffff',
          border: '2px solid #059669',
          padding: '14px 20px',
          marginBottom: '1.5rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: '0.82rem',
          letterSpacing: '0.08em',
          animation: 'fadeSlideIn 0.3s ease',
        }}>
          <span style={{ fontSize: '1.3rem' }}>✓</span>
          <span>INTRO MESSAGE AUTO-COPIED — JUST PASTE IT IN THE CHAT!</span>
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="brutalist-btn"
        style={{ marginBottom: '2rem', height: '40px', minHeight: '40px', padding: '0 1rem', fontSize: '0.8rem' }}
      >
        ← BACK
      </button>

      <div className="brutalist-card" style={{ padding: '2.5rem 2rem' }}>
        <h2 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>CONTACT SELLER</h2>
        <p className="label-caps" style={{ margin: '0 0 2rem', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
          {product.title.toUpperCase()} — ₹{product.price}
          {total_interest > 1 && <span style={{ marginLeft: '12px', color: '#ef4444' }}>🔥 {total_interest} INTERESTED</span>}
        </p>

        {/* Seller notes to buyer */}
        {product.notes_to_buyer && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '12px 16px',
            border: '2px dashed var(--border)',
            fontSize: '0.8rem',
            color: 'var(--muted-foreground)',
            lineHeight: 1.5,
          }}>
            <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', marginBottom: '4px' }}>📝 SELLER'S NOTE:</span>
            {product.notes_to_buyer}
          </div>
        )}

        {/* Copy message block */}
        <div className="brutalist-card" style={{ background: 'var(--muted)', padding: '1.25rem', marginBottom: '2rem' }}>
          <p className="label-caps" style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--foreground)' }}>
            PRE-COMPOSED INTRODUCTION{autoCopied ? ' — ✓ IN YOUR CLIPBOARD' : ''}
          </p>
          <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            {copy_message}
          </p>
          <button
            onClick={copyMessage}
            className="brutalist-btn"
            style={{
              padding: '0.5rem 1rem',
              height: '38px',
              minHeight: '38px',
              fontSize: '0.8rem',
              background: copied ? '#059669' : 'var(--accent)',
              color: copied ? 'white' : 'var(--accent-foreground)',
              borderColor: copied ? '#059669' : 'var(--accent)',
            }}
          >
            {copied ? '✓ COPIED AGAIN!' : '⎘ RE-COPY MESSAGE'}
          </button>
        </div>

        {/* Contact channel buttons */}
        <p className="label-caps" style={{ margin: '0 0 12px', fontSize: '0.75rem' }}>
          NOW PASTE &amp; REACH OUT VIA:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {contacts.map(c => (
            <a
              key={c.label}
              href={c.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="brutalist-card interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                textDecoration: 'none',
                ...(c.url ? {} : { opacity: 0.6, pointerEvents: 'none' }),
              }}
            >
              <span className="label-caps" style={{ fontSize: '0.8rem', color: 'inherit' }}>{c.icon} {c.label}</span>
              <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'inherit' }}>{c.value} {c.url ? '→' : '(COPY)'}</span>
            </a>
          ))}
        </div>

        {/* Meeting preference */}
        {seller.meeting_note && (
          <div style={{
            marginTop: '1.5rem',
            padding: '12px 16px',
            border: '2px dashed var(--border)',
            fontSize: '0.8rem',
            color: 'var(--muted-foreground)',
            fontWeight: 700,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}>
            📍 MEETING PREFERENCE: {seller.meeting_note}
          </div>
        )}

        <p className="label-caps" style={{ marginTop: '2rem', fontSize: '0.7rem', color: 'var(--muted-foreground)', textAlign: 'center', lineHeight: 1.4 }}>
          COMMUNICATION HAPPENS OUTSIDE CAMPUSKART. ALWAYS MEET IN A SAFE, PUBLIC PLACE.
        </p>
      </div>
    </div>
  );
};

export default ContactSeller;
